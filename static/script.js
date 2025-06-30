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
    loadSavedData();
    
    // Add git status checker
    checkGitStatus();
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
        
        // The success message is now handled in saveData function
        // Update git status
        setTimeout(checkGitStatus, 1000);
    } catch (error) {
        showMessage('Error saving activities. Please try again.', 'error');
        console.error('Save error:', error);
    } finally {
        // Restore button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function saveData(data, override = false) {
    // Save to Flask backend
    try {
        const response = await fetch('/api/save-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                date: data.date,
                data: data,
                override: override
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Data saved to file and committed to git:', result.message);
            
            // Show appropriate message based on push status
            if (result.pushed) {
                showMessage('Activities saved, committed, and pushed to GitHub! 🚀', 'success');
            } else if (result.committed) {
                showMessage('Activities saved and committed! (Push failed - check network)', 'warning');
            } else {
                showMessage('Activities saved locally! (Git operations failed)', 'warning');
            }
            
            // Also save to localStorage as backup
            const allData = JSON.parse(localStorage.getItem('activityTracker') || '[]');
            const today = data.date;
            const filteredData = allData.filter(entry => entry.date !== today);
            filteredData.push(data);
            localStorage.setItem('activityTracker', JSON.stringify(filteredData));
            
            return result;
        } else {
            throw new Error(`Server error: ${response.status}`);
        }
    } catch (error) {
        console.error('Flask API error:', error);
        
        // Fallback to localStorage only
        const allData = JSON.parse(localStorage.getItem('activityTracker') || '[]');
        const today = data.date;
        const filteredData = allData.filter(entry => entry.date !== today);
        filteredData.push(data);
        localStorage.setItem('activityTracker', JSON.stringify(filteredData));
        
        throw new Error('Could not save to server, saved to localStorage only');
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
    
    // Try to load from Flask backend first
    try {
        const response = await fetch(`/api/get-data/${today}`);
        if (response.ok) {
            todayData = await response.json();
            console.log('✅ Data loaded from Flask backend');
        }
    } catch (error) {
        console.warn('⚠️ Flask backend unavailable, falling back to localStorage');
    }
    
    // Fallback to localStorage if Flask fails
    if (!todayData) {
        const allData = JSON.parse(localStorage.getItem('activityTracker') || '[]');
        todayData = allData.find(entry => entry.date === today);
    }
    
    // Always start with cleared form by default
    // Users can manually load saved data if they want to edit
    clearForm();
    
    // Optional: Show a message if there's saved data available
    if (todayData) {
        showMessage('Found saved data for today. Click "Load Saved Data" if you want to edit previous entries.', 'info');
        // Store the saved data for potential loading later
        window.savedTodayData = todayData;
        showLoadDataButton();
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
    
    // Reset all quantity inputs to 0 (cleared state)
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.value = '0';
    });
    
    // Hide summary
    document.getElementById('summary').classList.add('hidden');
    document.getElementById('activityForm').style.display = 'block';
}

// Function to load saved data for editing
function loadSavedDataForEditing() {
    if (window.savedTodayData) {
        populateForm(window.savedTodayData);
        showSummary(window.savedTodayData);
        hideLoadDataButton();
    }
}

// Function to show/hide load data button
function showLoadDataButton() {
    let loadBtn = document.getElementById('loadDataBtn');
    if (!loadBtn) {
        loadBtn = document.createElement('button');
        loadBtn.id = 'loadDataBtn';
        loadBtn.type = 'button';
        loadBtn.className = 'edit-btn';
        loadBtn.innerHTML = '<i class="fas fa-upload"></i> Load Saved Data';
        loadBtn.onclick = loadSavedDataForEditing;
        
        const formActions = document.querySelector('.form-actions');
        formActions.appendChild(loadBtn);
    }
    loadBtn.style.display = 'flex';
}

function hideLoadDataButton() {
    const loadBtn = document.getElementById('loadDataBtn');
    if (loadBtn) {
        loadBtn.style.display = 'none';
    }
}

// Manual Edit Mode functionality
let isEditMode = false;

function toggleEditMode() {
    isEditMode = !isEditMode;
    const button = document.querySelector('.edit-mode-btn');
    const header = document.getElementById('editModeHeader');
    const form = document.getElementById('activityForm');
    
    if (isEditMode) {
        // Enable edit mode
        button.innerHTML = '<i class="fas fa-times"></i> Exit Edit Mode';
        button.classList.add('active');
        header.classList.add('active');
        form.classList.add('edit-mode');
        
        // Show all quantity controls and check all activities
        showAllQuantityControls();
        
        showMessage('Edit Mode enabled! Set exact values for each activity.', 'info');
    } else {
        // Save current data before exiting edit mode
        const hasSelectedActivities = document.querySelectorAll('input[type="checkbox"]:checked').length > 0;
        
        if (hasSelectedActivities) {
            // Ask user if they want to save before exiting
            const shouldSave = confirm('You have selected activities. Do you want to save them before exiting edit mode?\n\nClick OK to save and exit, or Cancel to exit without saving.');
            
            if (shouldSave) {
                // Collect form data
                const formData = new FormData(document.getElementById('activityForm'));
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
                
                if (activities.length > 0) {
                    // Save data
                    const data = {
                        activities,
                        quantities,
                        date: new Date().toISOString().split('T')[0],
                        timestamp: new Date().toISOString()
                    };
                    
                    // Show saving message
                    showMessage('Saving data before exiting edit mode...', 'info');
                    
                    // Save data and then exit edit mode
                    saveData(data, override = true).then(() => {
                        // After successful save, exit edit mode
                        exitEditModeAfterSave(button, header, form, true);
                    }).catch((error) => {
                        console.error('Save error:', error);
                        showMessage('Error saving data. Exiting edit mode anyway.', 'warning');
                        exitEditModeAfterSave(button, header, form, false);
                    });
                    
                    return; // Don't continue with immediate exit
                }
            }
        }
        
        // If no activities selected or user chose not to save, exit immediately
        exitEditModeAfterSave(button, header, form, false);
    }
}

function showAllQuantityControls() {
    // Check all checkboxes and show their quantity controls
    document.querySelectorAll('input[type="checkbox"][data-has-quantity="true"]').forEach(checkbox => {
        checkbox.checked = true;
        const activityItem = checkbox.closest('.activity-item');
        const quantityControl = activityItem.querySelector('.quantity-control');
        
        if (quantityControl) {
            quantityControl.classList.remove('hidden');
            quantityControl.style.display = 'block';
        }
        
        // Add visual feedback
        activityItem.style.background = 'linear-gradient(135deg, #fff9e6 0%, #fff3d0 100%)';
        activityItem.style.borderColor = '#ffd93d';
    });
    
    // Also check activities without quantities
    document.querySelectorAll('input[type="checkbox"]:not([data-has-quantity])').forEach(checkbox => {
        checkbox.checked = true;
        const activityItem = checkbox.closest('.activity-item');
        activityItem.style.background = 'linear-gradient(135deg, #fff9e6 0%, #fff3d0 100%)';
        activityItem.style.borderColor = '#ffd93d';
    });
}

function resetToNormalMode() {
    // Uncheck all checkboxes and hide quantity controls
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
        handleCheckboxChange({ target: checkbox });
    });
    
    // Reset all quantity inputs to 0
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.value = '0';
    });
}

// Helper function to exit edit mode after saving
function exitEditModeAfterSave(button, header, form, wasSaved = false) {
    // Disable edit mode UI
    button.innerHTML = '<i class="fas fa-edit"></i> Manual Edit Mode';
    button.classList.remove('active');
    header.classList.remove('active');
    form.classList.remove('edit-mode');
    
    // Reset to normal mode behavior
    resetToNormalMode();
    
    // Update global state
    isEditMode = false;
    
    if (wasSaved) {
        showMessage('Data saved and pushed to GitHub! Edit mode disabled.', 'success');
    } else {
        showMessage('Edit Mode disabled. Normal mode restored.', 'success');
    }
}

function setManualValues(activityData) {
    // Function to programmatically set specific values
    // Usage: setManualValues({engineering: 5, water: 3.5, sleep: 8})
    
    Object.entries(activityData).forEach(([activity, value]) => {
        const checkbox = document.querySelector(`input[value="${activity}"]`);
        const quantityInput = document.querySelector(`input[name="${activity}_quantity"]`);
        
        if (checkbox) {
            checkbox.checked = true;
            handleCheckboxChange({ target: checkbox });
            
            if (quantityInput && value !== undefined) {
                quantityInput.value = value;
            }
        }
    });
    
    showMessage(`Set values for ${Object.keys(activityData).length} activities`, 'success');
}

// Quick preset functions for common scenarios
function applyPreset(presetName) {
    const presets = {
        'productive_day': {
            engineering: 8,
            algorithm: 3,
            water: 4,
            eggs: 6,
            caffeine: 2,
            green_tea: 3,
            meals: 3,
            sleep: 8,
            whey_creatine: true
        },
        'light_day': {
            engineering: 2,
            water: 2,
            eggs: 2,
            meals: 2,
            sleep: 9,
            podcast: 2
        },
        'health_focus': {
            water: 5,
            eggs: 8,
            green_tea: 4,
            meals: 4,
            sleep: 8,
            runner: 1,
            whey_creatine: true
        }
    };
    
    const preset = presets[presetName];
    if (preset) {
        // Enable edit mode if not already enabled
        if (!isEditMode) {
            toggleEditMode();
        }
        
        // Clear current values
        resetToNormalMode();
        
        // Apply preset values
        setTimeout(() => {
            Object.entries(preset).forEach(([activity, value]) => {
                const checkbox = document.querySelector(`input[value="${activity}"]`);
                const quantityInput = document.querySelector(`input[name="${activity}_quantity"]`);
                
                if (checkbox) {
                    checkbox.checked = true;
                    const activityItem = checkbox.closest('.activity-item');
                    const quantityControl = activityItem.querySelector('.quantity-control');
                    
                    if (quantityControl) {
                        quantityControl.classList.remove('hidden');
                        quantityControl.style.display = 'block';
                    }
                    
                    if (quantityInput && typeof value === 'number') {
                        quantityInput.value = value;
                    }
                    
                    // Add visual feedback
                    activityItem.style.background = 'linear-gradient(135deg, #fff9e6 0%, #fff3d0 100%)';
                    activityItem.style.borderColor = '#ffd93d';
                }
            });
            
            showMessage(`Applied "${presetName}" preset successfully!`, 'success');
        }, 100);
    }
}

function applySelectedPreset() {
    const select = document.getElementById('presetSelect');
    const selectedPreset = select.value;
    
    if (selectedPreset) {
        applyPreset(selectedPreset);
        // Reset the select to placeholder
        setTimeout(() => {
            select.value = '';
        }, 500);
    }
}

function clearAllValues() {
    // Clear all quantity inputs while keeping checkboxes checked
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.value = '0';
    });
    
    showMessage('All values cleared to 0', 'info');
}

function setAllToValue(value) {
    // Utility function to set all activities to a specific value
    if (!isEditMode) {
        toggleEditMode();
        setTimeout(() => setAllToValue(value), 200);
        return;
    }
    
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.value = value;
    });
    
    showMessage(`Set all values to ${value}`, 'success');
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
    
    // Ctrl/Cmd + E to toggle edit mode
    if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        toggleEditMode();
    }
    
    // Ctrl/Cmd + 1/2/3 for quick presets (only in edit mode)
    if (isEditMode && (event.ctrlKey || event.metaKey)) {
        if (event.key === '1') {
            event.preventDefault();
            applyPreset('productive_day');
        } else if (event.key === '2') {
            event.preventDefault();
            applyPreset('light_day');
        } else if (event.key === '3') {
            event.preventDefault();
            applyPreset('health_focus');
        }
    }
    
    // Escape key to close modal
    if (event.key === 'Escape') {
        const modal = document.getElementById('quickValueModal');
        if (!modal.classList.contains('hidden')) {
            closeQuickValueModal();
        }
    }
    
    // Ctrl/Cmd + Q for quick input (only in edit mode)
    if (isEditMode && (event.ctrlKey || event.metaKey) && event.key === 'q') {
        event.preventDefault();
        openQuickValueModal();
    }
    
    // Ctrl/Cmd + Shift + S to save and exit edit mode
    if (isEditMode && (event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        // Force save by simulating clicking exit edit mode with selected activities
        const hasSelectedActivities = document.querySelectorAll('input[type="checkbox"]:checked').length > 0;
        if (hasSelectedActivities) {
            // Directly trigger save without confirmation dialog
            const formData = new FormData(document.getElementById('activityForm'));
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
            
            if (activities.length > 0) {
                // Save data
                const data = {
                    activities,
                    quantities,
                    date: new Date().toISOString().split('T')[0],
                    timestamp: new Date().toISOString()
                };
                
                showMessage('Quick save and exit...', 'info');
                
                saveData(data).then(() => {
                    const button = document.querySelector('.edit-mode-btn');
                    const header = document.getElementById('editModeHeader');
                    const form = document.getElementById('activityForm');
                    exitEditModeAfterSave(button, header, form, true);
                }).catch((error) => {
                    console.error('Save error:', error);
                    showMessage('Error saving data.', 'error');
                });
            }
        } else {
            showMessage('No activities selected to save.', 'warning');
        }
    }
});

// Quick Value Modal functions
function openQuickValueModal() {
    if (!isEditMode) {
        toggleEditMode();
        setTimeout(openQuickValueModal, 200);
        return;
    }
    
    const modal = document.getElementById('quickValueModal');
    modal.classList.remove('hidden');
    
    // Focus on the textarea
    setTimeout(() => {
        document.getElementById('quickValueInput').focus();
    }, 100);
}

function closeQuickValueModal() {
    const modal = document.getElementById('quickValueModal');
    modal.classList.add('hidden');
    
    // Clear the input
    document.getElementById('quickValueInput').value = '';
}

function applyQuickValues() {
    const input = document.getElementById('quickValueInput').value.trim();
    
    if (!input) {
        showMessage('Please enter some values!', 'error');
        return;
    }
    
    const values = input.split(',').map(v => v.trim());
    const activities = [
        'engineering', 'algorithm', 'teknokian', 'runner',
        'water', 'eggs', 'caffeine', 'no_fear', 'neem_tulsi',
        'green_tea', 'meals', 'sleep', 'podcast', 'finance'
    ];
    
    // Clear current values first
    resetToNormalMode();
    
    // Apply the values
    setTimeout(() => {
        let appliedCount = 0;
        
        values.forEach((value, index) => {
            if (index < activities.length && value !== '' && value !== '0') {
                const activity = activities[index];
                const checkbox = document.querySelector(`input[value="${activity}"]`);
                const quantityInput = document.querySelector(`input[name="${activity}_quantity"]`);
                
                if (checkbox) {
                    checkbox.checked = true;
                    const activityItem = checkbox.closest('.activity-item');
                    const quantityControl = activityItem.querySelector('.quantity-control');
                    
                    if (quantityControl) {
                        quantityControl.classList.remove('hidden');
                        quantityControl.style.display = 'block';
                    }
                    
                    if (quantityInput) {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                            quantityInput.value = numValue;
                        } else {
                            quantityInput.value = 1; // Default for non-numeric values
                        }
                    }
                    
                    // Add visual feedback
                    activityItem.style.background = 'linear-gradient(135deg, #fff9e6 0%, #fff3d0 100%)';
                    activityItem.style.borderColor = '#ffd93d';
                    appliedCount++;
                }
            }
        });
        
        closeQuickValueModal();
        showMessage(`Applied values to ${appliedCount} activities!`, 'success');
    }, 100);
}

// Export current values as comma-separated string (for copying)
function exportCurrentValues() {
    const activities = [
        'engineering', 'algorithm', 'teknokian', 'runner',
        'water', 'eggs', 'caffeine', 'no_fear', 'neem_tulsi',
        'green_tea', 'meals', 'sleep', 'podcast', 'finance'
    ];
    
    const values = activities.map(activity => {
        const checkbox = document.querySelector(`input[value="${activity}"]`);
        const quantityInput = document.querySelector(`input[name="${activity}_quantity"]`);
        
        if (checkbox && checkbox.checked) {
            return quantityInput ? quantityInput.value : '1';
        }
        return '0';
    });
    
    const valueString = values.join(',');
    
    // Copy to clipboard if possible
    if (navigator.clipboard) {
        navigator.clipboard.writeText(valueString).then(() => {
            showMessage('Current values copied to clipboard!', 'success');
        });
    } else {
        // Fallback: show in modal
        alert(`Current values:\n${valueString}\n\nCopy this text manually.`);
    }
    
    return valueString;
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

// Check git status and show in UI
async function checkGitStatus() {
    try {
        const response = await fetch('/api/git-status');
        if (response.ok) {
            const status = await response.json();
            showGitStatus(status);
        }
    } catch (error) {
        console.log('Could not check git status:', error);
    }
}

// Show git status in UI
function showGitStatus(status) {
    // Remove existing status
    const existingStatus = document.querySelector('.git-status');
    if (existingStatus) existingStatus.remove();
    
    const header = document.querySelector('.header');
    const statusDiv = document.createElement('div');
    header.appendChild(statusDiv.firstElementChild);
}

// Push changes to GitHub
async function pushToGitHub() {
    try {
        showMessage('Pushing to GitHub...', 'info');
        
        const response = await fetch('/api/push-to-github', {
            method: 'POST'
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage('Successfully pushed to GitHub! 🎉', 'success');
            setTimeout(checkGitStatus, 1000);
        } else {
            const error = await response.json();
            showMessage(`Push failed: ${error.error}`, 'error');
        }
    } catch (error) {
        showMessage('Push failed: Network error', 'error');
    }
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
