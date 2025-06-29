// Analytics JavaScript
let chartInstances = {};

document.addEventListener('DOMContentLoaded', function() {
    initializeDateInputs();
    setupEventListeners();
    loadAvailableDates();
});

function initializeDateInputs() {
    const today = new Date().toISOString().split('T')[0];
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    document.getElementById('startDate').value = oneWeekAgo;
    document.getElementById('endDate').value = today;
}

function setupEventListeners() {
    document.getElementById('generateAnalytics').addEventListener('click', generateAnalytics);
    
    // Quick range buttons
    document.querySelectorAll('.quick-range-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const days = this.dataset.days;
            setQuickRange(days);
        });
    });
}

async function loadAvailableDates() {
    try {
        const response = await fetch('/api/available-dates');
        const data = await response.json();
        
        if (data.dates && data.dates.length > 0) {
            // Set default range to cover available data
            document.getElementById('startDate').value = data.earliest;
            document.getElementById('endDate').value = data.latest;
        }
    } catch (error) {
        console.error('Error loading available dates:', error);
    }
}

function setQuickRange(days) {
    const endDate = new Date().toISOString().split('T')[0];
    let startDate;
    
    if (days === 'all') {
        // Load all available dates
        loadAvailableDates();
        return;
    }
    
    const daysBack = parseInt(days);
    startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    document.getElementById('startDate').value = startDate;
    document.getElementById('endDate').value = endDate;
}

async function generateAnalytics() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        showError('Please select both start and end dates');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showError('Start date cannot be after end date');
        return;
    }
    
    showLoading(true);
    hideError();
    
    try {
        const response = await fetch('/api/analytics-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                start_date: startDate,
                end_date: endDate
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayAnalytics(data);
        } else {
            showError(data.error || 'Failed to generate analytics');
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function displayAnalytics(data) {
    // Categorize activities
    const categorizedData = categorizeActivities(data);
    
    // Update summary stats
    document.getElementById('totalDays').textContent = data.total_days;
    document.getElementById('uniqueActivities').textContent = Object.keys(data.aggregated_activities).length;
    document.getElementById('dateRange').textContent = data.date_range;
    
    // Find most frequent activity
    const activities = data.aggregated_activities;
    const mostFrequent = Object.keys(activities).reduce((a, b) => 
        activities[a] > activities[b] ? a : b, Object.keys(activities)[0] || '-'
    );
    document.getElementById('mostFrequent').textContent = mostFrequent || '-';
    
    // Create categorized charts
    createCategorizedCharts(categorizedData);
    createTimelineChart(data.daily_data);
    
    // Create categorized activity tables
    createCategorizedTables(categorizedData, data.total_days);
    
    // Show results
    document.getElementById('analyticsResults').classList.remove('hidden');
}

// Old chart functions removed - now using categorized charts

function createTimelineChart(dailyData) {
    const ctx = document.getElementById('timelineChart').getContext('2d');
    
    if (chartInstances.timeline) {
        chartInstances.timeline.destroy();
    }
    
    // Prepare timeline data - show key activities over time
    const dates = dailyData.map(day => day.date);
    const keyActivities = ['water', 'sleep', 'eggs', 'engineering']; // Focus on key quantifiable activities
    
    const datasets = keyActivities.map((activity, index) => {
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c'];
        return {
            label: activity.charAt(0).toUpperCase() + activity.slice(1),
            data: dailyData.map(day => day.quantities[activity] || 0),
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '20',
            fill: false,
            tension: 0.1
        };
    }).filter(dataset => dataset.data.some(value => value > 0)); // Only show activities with data
    
    chartInstances.timeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Old table function removed - now using categorized tables

function categorizeActivities(data) {
    // Define activity categories
    const categories = {
        identities: ['engineering', 'algorithm', 'teknokian', 'runner'],
        health: ['water', 'eggs', 'whey_creatine', 'caffeine', 'no_fear', 'neem_tulsi', 'green_tea', 'meals'],
        recreations: ['sleep', 'podcast', 'finance']
    };
    
    const categorizedData = {
        identities: { activities: {}, quantities: {}, averages: {} },
        health: { activities: {}, quantities: {}, averages: {} },
        recreations: { activities: {}, quantities: {}, averages: {} }
    };
    
    // Categorize activities
    Object.keys(data.aggregated_activities).forEach(activity => {
        for (const [category, activityList] of Object.entries(categories)) {
            if (activityList.includes(activity)) {
                categorizedData[category].activities[activity] = data.aggregated_activities[activity];
                if (data.aggregated_quantities[activity]) {
                    categorizedData[category].quantities[activity] = data.aggregated_quantities[activity];
                }
                if (data.average_quantities[activity]) {
                    categorizedData[category].averages[activity] = data.average_quantities[activity];
                }
                break;
            }
        }
    });
    
    return categorizedData;
}

function createCategorizedCharts(categorizedData) {
    // Create charts for each category
    createCategoryChart('identities', categorizedData.identities, '#667eea');
    createCategoryChart('health', categorizedData.health, '#f5576c');
    createCategoryChart('recreations', categorizedData.recreations, '#43e97b');
}

function createCategoryChart(category, data, color) {
    const frequencyCtx = document.getElementById(`${category}FrequencyChart`).getContext('2d');
    const quantityCtx = document.getElementById(`${category}QuantityChart`).getContext('2d');
    
    // Destroy existing charts
    if (chartInstances[`${category}Frequency`]) {
        chartInstances[`${category}Frequency`].destroy();
    }
    if (chartInstances[`${category}Quantity`]) {
        chartInstances[`${category}Quantity`].destroy();
    }
    
    // Frequency chart
    const freqLabels = Object.keys(data.activities);
    const freqData = Object.values(data.activities);
    
    if (freqLabels.length > 0) {
        chartInstances[`${category}Frequency`] = new Chart(frequencyCtx, {
            type: 'bar',
            data: {
                labels: freqLabels,
                datasets: [{
                    label: 'Days Done',
                    data: freqData,
                    backgroundColor: color + '80',
                    borderColor: color,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: `${category.charAt(0).toUpperCase() + category.slice(1)} - Frequency`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }
    
    // Quantity chart
    const qtyLabels = Object.keys(data.quantities);
    const qtyData = Object.values(data.quantities);
    
    if (qtyLabels.length > 0) {
        chartInstances[`${category}Quantity`] = new Chart(quantityCtx, {
            type: 'doughnut',
            data: {
                labels: qtyLabels,
                datasets: [{
                    data: qtyData,
                    backgroundColor: generateColorVariations(color, qtyLabels.length)
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    title: {
                        display: true,
                        text: `${category.charAt(0).toUpperCase() + category.slice(1)} - Total Quantities`
                    }
                }
            }
        });
    }
}

function generateColorVariations(baseColor, count) {
    const colors = [];
    const hue = getHueFromColor(baseColor);
    
    for (let i = 0; i < count; i++) {
        const saturation = 70 + (i * 10) % 30;
        const lightness = 50 + (i * 15) % 40;
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    
    return colors;
}

function getHueFromColor(color) {
    // Simple mapping of common colors to hue values
    const colorMap = {
        '#667eea': 230,
        '#f5576c': 350,
        '#43e97b': 140
    };
    return colorMap[color] || 200;
}

function createCategorizedTables(categorizedData, totalDays) {
    Object.keys(categorizedData).forEach(category => {
        createCategoryTable(category, categorizedData[category], totalDays);
    });
}

function createCategoryTable(category, data, totalDays) {
    const tbody = document.querySelector(`#${category}Table tbody`);
    tbody.innerHTML = '';
    
    const activities = data.activities;
    const quantities = data.quantities;
    const averages = data.averages;
    
    Object.keys(activities).forEach(activity => {
        const row = tbody.insertRow();
        const daysDone = activities[activity];
        const frequency = totalDays > 0 ? ((daysDone / totalDays) * 100).toFixed(1) : 0;
        const totalQuantity = quantities[activity] || 0;
        const avgQuantity = averages[activity] || 0;
        
        row.innerHTML = `
            <td><strong>${activity}</strong></td>
            <td>${daysDone}</td>
            <td>${frequency}%</td>
            <td>${totalQuantity}</td>
            <td>${avgQuantity}</td>
        `;
    });
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    const results = document.getElementById('analyticsResults');
    
    if (show) {
        loading.classList.remove('hidden');
        results.classList.add('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    document.getElementById('errorMessage').classList.add('hidden');
}
