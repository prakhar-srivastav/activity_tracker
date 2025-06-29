// Activity Tracker JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    const form = document.getElementById('activityForm');
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    
    // Add event listeners to checkboxes
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckboxChange);
    });
    
    // Add form submit listener
    form.addEventListener('submit', handleFormSubmit);
    
    // Load saved data if available
    // loadSavedData();
}

function handleCheckboxChange(event) {
    const checkbox = event.target;
    const hasQuantity = checkbox.dataset.hasQuantity === 'true';
    
    if (hasQuantity) {
        const activityItem = checkbox.closest('.activity-item');
        const quantityControl = activityItem.querySelector('.quantity-control');
        
        if (checkbox.checked) {
            quantityControl.classList.remove('hidden');
            // Add a nice slide-down animation
            quantityControl.style.maxHeight = '0';
            quantityControl.style.opacity = '0';
            quantityControl.offsetHeight; // Force reflow
            quantityControl.style.transition = 'all 0.3s ease';
            quantityControl.style.maxHeight = '200px';
            quantityControl.style.opacity = '1';
        } else {
            quantityControl.style.maxHeight = '0';
            quantityControl.style.opacity = '0';
            setTimeout(() => {
                quantityControl.classList.add('hidden');
                quantityControl.style.maxHeight = '';
                quantityControl.style.opacity = '';
                quantityControl.style.transition = '';
            }, 300);
        }
    }
    
    // Add visual feedback
    const activityItem = checkbox.closest('.activity-item');
    if (checkbox.checked) {
        activityItem.style.background = 'linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 100%)';
        activityItem.style.borderColor = '#667eea';
    } else {
        activityItem.style.background = 'white';
        activityItem.style.borderColor = '#dee2e6';
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const activities = [];
    const quantities = {};
    
    // Collect selected activities
    formData.getAll('activity').forEach(activity => {
        activities.push(activity);
    });
    
    // Collect quantities
    for (let [key, value] of formData.entries()) {
        if (key.endsWith('_quantity')) {
            const activityName = key.replace('_quantity', '');
            quantities[activityName] = parseFloat(value);
        }
    }
    
    if (activities.length === 0) {
        showMessage('Please select at least one activity!', 'error');
        return;
    }
    
    // Save data
    const data = {
        activities,
        quantities,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
    };
    
    // Show loading state
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="loading"></div> Saving...';
    submitBtn.disabled = true;
    
    try {
        await saveData(data);
        showSummary(data);
        
        // Auto-download JSON file for GitHub commit
        downloadDataFile(data);
        
        showMessage('Activities saved! JSON file downloaded for GitHub commit 📁', 'success');
        showGitInstructions(data.date);
    } catch (error) {
        showMessage('Error saving activities. Please try again.', 'error');
        console.error('Save error:', error);
    } finally {
        // Restore button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function saveData(data) {
    // Save to localStorage (primary storage for GitHub Pages)
    const allData = JSON.parse(localStorage.getItem('activityTracker') || '[]');
    
    // Remove any existing entry for today
    const today = data.date;
    const filteredData = allData.filter(entry => entry.date !== today);
    
    // Add new entry
    filteredData.push(data);
    
    localStorage.setItem('activityTracker', JSON.stringify(filteredData));
    
    // Also try to load existing data from GitHub repository
    try {
        await loadFromGitHub(data.date);
    } catch (error) {
        console.log('GitHub data not available, using localStorage only');
    }
}

// Download JSON file for manual GitHub commit
function downloadDataFile(data) {
    const fileName = `${data.date}.json`;
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = fileName;
    link.click();
    
    // Also update the data folder readme
    updateDataReadme();
}

// Show git instructions for committing the file
function showGitInstructions(date) {
    const instructionsHTML = `
        <div class="git-instructions">
            <h4>🔧 Git Instructions:</h4>
            <ol>
                <li>Move the downloaded <code>${date}.json</code> file to your <code>data/</code> folder</li>
                <li>Run: <code>git add data/${date}.json</code></li>
                <li>Run: <code>git commit -m "Add activity data for ${date}"</code></li>
                <li>Run: <code>git push origin main</code></li>
            </ol>
            <button onclick="hideGitInstructions()" class="close-instructions">Got it! ✓</button>
        </div>
    `;
    
    // Remove existing instructions
    const existing = document.querySelector('.git-instructions');
    if (existing) existing.remove();
    
    // Add new instructions
    const mainContent = document.querySelector('.main-content');
    const instructionsDiv = document.createElement('div');
    instructionsDiv.innerHTML = instructionsHTML;
    mainContent.appendChild(instructionsDiv.firstElementChild);
}

function hideGitInstructions() {
    const instructions = document.querySelector('.git-instructions');
    if (instructions) {
        instructions.style.opacity = '0';
        setTimeout(() => instructions.remove(), 300);
    }
}

// Try to load data from GitHub repository
async function loadFromGitHub(date) {
    try {
        const response = await fetch(`./data/${date}.json`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Data loaded from GitHub repository');
            return data;
        }
    } catch (error) {
        console.log('No existing data file in repository');
    }
    return null;
}

function updateDataReadme() {
    const readmeData = {
        description: "This folder contains daily activity tracking data",
        format: "Each file is named YYYY-MM-DD.json and contains the day's activity data",
        lastUpdated: new Date().toISOString(),
        instructions: "Files are generated by the Activity Tracker website and should be committed to Git"
    };
    
    const dataBlob = new Blob([JSON.stringify(readmeData, null, 2)], {type: 'application/json'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'README.json';
    link.click();
}

async function loadSavedData() {
    const today = new Date().toISOString().split('T')[0];
    let todayData = null;
    
    // Try to load from GitHub repository first
    todayData = await loadFromGitHub(today);
    
    // Fallback to localStorage if GitHub file not found
    if (!todayData) {
        const allData = JSON.parse(localStorage.getItem('activityTracker') || '[]');
        todayData = allData.find(entry => entry.date === today);
    }
    
    if (todayData) {
        // Pre-fill the form with today's data
        populateForm(todayData);
        showSummary(todayData);
    }
}

function populateForm(data) {
    // Clear form first
    clearForm();
    
    // Check the appropriate checkboxes
    data.activities.forEach(activity => {
        const checkbox = document.querySelector(`input[value="${activity}"]`);
        if (checkbox) {
            checkbox.checked = true;
            handleCheckboxChange({ target: checkbox });
            
            // Set quantity if available
            const quantity = data.quantities[activity];
            if (quantity !== undefined) {
                const quantityInput = document.querySelector(`input[name="${activity}_quantity"]`);
                if (quantityInput) {
                    quantityInput.value = quantity;
                }
            }
        }
    });
}

function showSummary(data) {
    const summaryElement = document.getElementById('summary');
    const summaryContent = document.getElementById('summaryContent');
    const form = document.getElementById('activityForm');
    
    // Generate summary content
    let summaryHTML = '';
    
    data.activities.forEach(activity => {
        const activityName = getActivityDisplayName(activity);
        const quantity = data.quantities[activity];
        const unit = getActivityUnit(activity);
        
        summaryHTML += `
            <div class="summary-item">
                <span class="activity-name">${activityName}</span>
                <span class="activity-quantity">
                    ${quantity !== undefined ? `${quantity} ${unit}` : '✓ Completed'}
                </span>
            </div>
        `;
    });
    
    summaryContent.innerHTML = summaryHTML;
    
    // Hide form and show summary
    form.style.display = 'none';
    summaryElement.classList.remove('hidden');
    
    // Animate summary items
    const summaryItems = summaryElement.querySelectorAll('.summary-item');
    summaryItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        setTimeout(() => {
            item.style.transition = 'all 0.3s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function showForm() {
    const summaryElement = document.getElementById('summary');
    const form = document.getElementById('activityForm');
    
    summaryElement.classList.add('hidden');
    form.style.display = 'block';
}

function clearForm() {
    // Uncheck all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
        handleCheckboxChange({ target: checkbox });
    });
    
    // Reset all quantity inputs
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.value = input.getAttribute('value') || '1';
    });
    
    // Hide summary
    document.getElementById('summary').classList.add('hidden');
    document.getElementById('activityForm').style.display = 'block';
}

function getActivityDisplayName(activity) {
    const displayNames = {
        'engineering': 'Engineering Identity',
        'algorithm': 'Algorithm Identity',
        'teknokian': 'Teknokian Identity',
        'runner': 'Runner Identity',
        'water': 'Water',
        'eggs': 'Eggs',
        'whey_creatine': 'Whey and Creatine',
        'caffeine': 'Caffeine Pill',
        'no_fear': 'No Fear',
        'neem_tulsi': 'Neem Tulsi Syrup',
        'green_tea': 'Green Tea',
        'meals': 'Meals',
        'sleep': 'Sleep',
        'podcast': 'Podcast',
        'finance': 'Finance'
    };
    
    return displayNames[activity] || activity;
}

function getActivityUnit(activity) {
    const units = {
        'engineering': 'amount',
        'algorithm': 'amount',
        'teknokian': 'amount',
        'runner': 'amount',
        'water': 'L',
        'eggs': 'eggs',
        'caffeine': 'pills',
        'no_fear': 'amount',
        'neem_tulsi': 'amount',
        'green_tea': 'cups',
        'sleep': 'hours',
        'podcast': 'episodes',
        'finance': 'amount'
    };
    
    return units[activity] || 'times';
}

function showMessage(message, type = 'success') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}-message`;
    messageElement.textContent = message;
    
    // Insert at the top of main content
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(messageElement, mainContent.firstChild);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            messageElement.remove();
        }, 300);
    }, 3000);
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + S to save
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        const submitBtn = document.querySelector('.submit-btn');
        if (submitBtn.style.display !== 'none') {
            submitBtn.click();
        }
    }
    
    // Ctrl/Cmd + R to reset
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        clearForm();
    }
});

// Add smooth scrolling for better UX
function smoothScrollTo(element) {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Weekly/Monthly summary function (bonus feature)
function getWeeklySummary() {
    const allData = JSON.parse(localStorage.getItem('activityTracker') || '[]');
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekData = allData.filter(entry => new Date(entry.date) >= weekAgo);
    
    const summary = {};
    weekData.forEach(day => {
        day.activities.forEach(activity => {
            if (!summary[activity]) {
                summary[activity] = { count: 0, totalQuantity: 0 };
            }
            summary[activity].count++;
            if (day.quantities[activity]) {
                summary[activity].totalQuantity += day.quantities[activity];
            }
        });
    });
    
    return summary;
}

// Export data function
function exportData() {
    const allData = JSON.parse(localStorage.getItem('activityTracker') || '[]');
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `activity-tracker-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}
