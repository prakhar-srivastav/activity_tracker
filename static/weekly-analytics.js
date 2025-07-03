// Weekly Analytics JavaScript
let chartInstances = {};

// Weekly goals configuration
const WEEKLY_GOALS = {
    runner: 6,
    engineering: 40,
    algorithm: 40,
    teknokian: 9,
    water: 25,        // 25L of water per week
    no_fear: 0,       // 0 no fear (even 1 is bad)
    sleep: 56,        // 8 hours × 7 days = 56 hours
    protein: 980      // 980g of protein per week
};

document.addEventListener('DOMContentLoaded', function() {
    initializeWeeklyAnalytics();
    setupEventListeners();
    // Auto-generate analytics for current week on load
    generateWeeklyAnalytics();
});

function initializeWeeklyAnalytics() {
    // Calculate current week range (Sunday to Saturday)
    const currentWeek = getCurrentWeekRange();
    document.getElementById('weekRange').textContent = currentWeek.display;
}

function setupEventListeners() {
    document.getElementById('generateWeeklyAnalytics').addEventListener('click', generateWeeklyAnalytics);
    
    // Week selector change event
    document.getElementById('weekOffset').addEventListener('change', function() {
        generateWeeklyAnalytics();
    });
}

function getCurrentWeekRange() {
    const today = new Date();
    const weekOffset = parseInt(document.getElementById('weekOffset')?.value || 0);
    
    // Calculate days since last Sunday (start of week)
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysSinceLastSunday = dayOfWeek;
    
    // Get Sunday of current week (start of week)
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - daysSinceLastSunday - (weekOffset * 7));
    
    // Get Saturday of current week (end of week)
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    
    return {
        start: sunday.toISOString().split('T')[0],
        end: saturday.toISOString().split('T')[0],
        display: `${formatDate(sunday)} - ${formatDate(saturday)}`
    };
}

function formatDate(date) {
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

async function generateWeeklyAnalytics() {
    showLoading(true);
    hideError();
    
    try {
        const weekRange = getCurrentWeekRange();
        
        const response = await fetch('/api/analytics-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                start_date: weekRange.start,
                end_date: weekRange.end
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayWeeklyAnalytics(data, weekRange);
        } else {
            showError(data.error || 'Failed to generate analytics');
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function displayWeeklyAnalytics(data, weekRange) {
    // Update week status
    const today = new Date();
    const endOfWeek = new Date(weekRange.end);
    const isWeekComplete = today > endOfWeek;
    
    document.getElementById('weekStatus').textContent = isWeekComplete ? 'Completed' : 'In Progress';
    document.getElementById('weekStatus').className = isWeekComplete ? 'week-status status-complete' : 'week-status status-in-progress';
    
    // Update identities goals
    updateIdentitiesGoals(data, isWeekComplete);
    
    // Update additional weekly goals
    updateAdditionalGoals(data, isWeekComplete);
    
    // Update health section
    updateHealthSection(data);
    
    // Update sleep section
    updateSleepSection(data);
    
    // Update other activities
    updateOtherActivities(data);
    
    // Create identities daily chart
    createIdentitiesDailyChart(data.daily_data);
    
    // Show results
    document.getElementById('analyticsResults').classList.remove('hidden');
}

function updateIdentitiesGoals(data, isWeekComplete) {
    const identities = [
        { key: 'runner', id: 'runner' },
        { key: 'engineering', id: 'engineer' },  // Fix: 'engineering' data key maps to 'engineer' HTML id
        { key: 'algorithm', id: 'algorithm' },
        { key: 'teknokian', id: 'teknokian' }
    ];
    
    identities.forEach(identity => {
        const current = data.aggregated_quantities[identity.key] || 0;
        const goal = WEEKLY_GOALS[identity.key];
        const percentage = Math.min((current / goal) * 100, 100);
        const remaining = Math.max(goal - current, 0);
        
        // Update current value
        const currentElement = document.getElementById(`${identity.id}Current`);
        if (currentElement) {
            currentElement.textContent = current;
        }
        
        // Update progress bar
        const progressElement = document.getElementById(`${identity.id}Progress`);
        if (progressElement) {
            progressElement.style.width = percentage + '%';
        }
        
        // Determine status and milestone
        const statusInfo = getGoalStatus(current, goal, isWeekComplete);
        
        const statusElement = document.getElementById(`${identity.id}Status`);
        if (statusElement) {
            statusElement.textContent = statusInfo.status;
        }
        
        const milestoneElement = document.getElementById(`${identity.id}Milestone`);
        if (milestoneElement) {
            milestoneElement.textContent = statusInfo.milestone;
        }
        
        // Update progress bar color based on status
        if (progressElement) {
            progressElement.className = `progress-fill ${statusInfo.statusClass}`;
        }
    });
}

function getGoalStatus(current, goal, isWeekComplete) {
    const percentage = (current / goal) * 100;
    const remaining = goal - current;
    
    if (current >= goal) {
        return {
            status: "🎉 Goal Achieved!",
            milestone: `Exceeded by ${current - goal}! Amazing work!`,
            statusClass: "status-ahead"
        };
    }
    
    if (isWeekComplete) {
        return {
            status: "❌ Week Completed",
            milestone: `Missed goal by ${remaining}. Focus more next week!`,
            statusClass: "status-critical"
        };
    }
    
    // Calculate days remaining in week (Sunday = 0, Saturday = 6)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilSaturday = dayOfWeek === 6 ? 0 : 6 - dayOfWeek;
    
    if (percentage >= 80) {
        return {
            status: "🔥 On Track",
            milestone: `Just ${remaining} more to reach your goal! You've got this!`,
            statusClass: "status-on-track"
        };
    } else if (percentage >= 50) {
        const dailyTarget = Math.ceil(remaining / Math.max(daysUntilSaturday, 1));
        return {
            status: "⚠️ Behind Target",
            milestone: `Need ${dailyTarget} per day for ${daysUntilSaturday} days to catch up`,
            statusClass: "status-behind"
        };
    } else {
        const dailyTarget = Math.ceil(remaining / Math.max(daysUntilSaturday, 1));
        return {
            status: "🚨 Critical",
            milestone: `Major push needed: ${dailyTarget} per day to reach goal!`,
            statusClass: "status-critical"
        };
    }
}

function updateAdditionalGoals(data, isWeekComplete) {
    // Water Goal (25L per week)
    const waterCurrent = data.aggregated_quantities.water || 0;
    const waterGoal = WEEKLY_GOALS.water;
    updateGoalCard('water', waterCurrent, waterGoal, 'L', isWeekComplete);
    
    // No Fear Goal (0 is ideal, even 1 is bad)
    const noFearCurrent = data.aggregated_quantities.no_fear || 0;
    const noFearGoal = WEEKLY_GOALS.no_fear;
    updateNoFearGoal(noFearCurrent, isWeekComplete);
    
    // Sleep Goal (56 hours = 8 hours × 7 days)
    const sleepCurrent = data.aggregated_quantities.sleep || 0;
    const sleepGoal = WEEKLY_GOALS.sleep;
    const averageSleep = data.total_days > 0 ? (sleepCurrent / data.total_days).toFixed(1) : 0;
    updateSleepGoal(sleepCurrent, sleepGoal, averageSleep, isWeekComplete);
    
    // Protein Goal (980g per week)
    const wheyCount = data.aggregated_activities.whey_creatine || 0;
    const eggsAmount = data.aggregated_quantities.eggs || 0;
    const mealsAmount = data.aggregated_quantities.meals || 0;
    const proteinCurrent = (wheyCount * 25) + (eggsAmount * 3.6) + (mealsAmount * 30);
    const proteinGoal = WEEKLY_GOALS.protein;
    updateGoalCard('protein', Math.round(proteinCurrent), proteinGoal, 'g', isWeekComplete);
}

function updateGoalCard(goalType, current, goal, unit, isWeekComplete) {
    const percentage = Math.min((current / goal) * 100, 100);
    
    // Update current value
    const currentElement = document.getElementById(`${goalType}Current`);
    if (currentElement) {
        currentElement.textContent = current + unit;
    }
    
    // Update progress bar
    const progressElement = document.getElementById(`${goalType}Progress`);
    if (progressElement) {
        progressElement.style.width = percentage + '%';
    }
    
    // Determine status and milestone
    const statusInfo = getGoalStatus(current, goal, isWeekComplete);
    
    const statusElement = document.getElementById(`${goalType}Status`);
    if (statusElement) {
        statusElement.textContent = statusInfo.status;
    }
    
    const milestoneElement = document.getElementById(`${goalType}Milestone`);
    if (milestoneElement) {
        milestoneElement.textContent = statusInfo.milestone;
    }
    
    // Update progress bar color
    if (progressElement) {
        progressElement.className = `progress-fill ${statusInfo.statusClass}`;
    }
}

function updateNoFearGoal(current, isWeekComplete) {
    const currentElement = document.getElementById('noFearCurrent');
    const statusElement = document.getElementById('noFearStatus');
    const milestoneElement = document.getElementById('noFearMilestone');
    const progressElement = document.getElementById('noFearProgress');
    
    if (currentElement) currentElement.textContent = current;
    
    if (current === 0) {
        // Perfect! No fear instances
        if (statusElement) statusElement.textContent = "🎉 Perfect Week!";
        if (milestoneElement) milestoneElement.textContent = "Zero fear instances - you're conquering your fears!";
        if (progressElement) {
            progressElement.style.width = '100%';
            progressElement.className = 'progress-fill status-ahead';
        }
    } else {
        // Any fear is bad
        if (statusElement) statusElement.textContent = "⚠️ Fear Detected";
        if (milestoneElement) milestoneElement.textContent = `${current} fear instance${current > 1 ? 's' : ''} this week. Focus on courage!`;
        if (progressElement) {
            progressElement.style.width = '0%';
            progressElement.className = 'progress-fill status-critical';
        }
    }
}

function updateSleepGoal(current, goal, average, isWeekComplete) {
    const percentage = Math.min((current / goal) * 100, 100);
    
    const currentElement = document.getElementById('sleepGoalCurrent');
    const statusElement = document.getElementById('sleepGoalStatus');
    const milestoneElement = document.getElementById('sleepGoalMilestone');
    const progressElement = document.getElementById('sleepGoalProgress');
    
    if (currentElement) currentElement.textContent = `${current}h (avg: ${average}h)`;
    
    if (progressElement) progressElement.style.width = percentage + '%';
    
    const statusInfo = getGoalStatus(current, goal, isWeekComplete);
    if (statusElement) statusElement.textContent = statusInfo.status;
    if (milestoneElement) milestoneElement.textContent = statusInfo.milestone;
    if (progressElement) progressElement.className = `progress-fill ${statusInfo.statusClass}`;
}

function updateHealthSection(data) {
    const wheyCount = data.aggregated_activities.whey_creatine || 0;
    const eggsAmount = data.aggregated_quantities.eggs || 0;
    const mealsAmount = data.aggregated_quantities.meals || 0;
    
    document.getElementById('eggsValue').textContent = eggsAmount;
    document.getElementById('wheyValue').textContent = wheyCount;
    document.getElementById('mealsValue').textContent = mealsAmount;
    
    // Calculate total protein for the week
    const totalProtein = (wheyCount * 25) + (eggsAmount * 3.6) + (mealsAmount * 30);
    document.getElementById('proteinValue').textContent = Math.round(totalProtein) + 'g';
    
    document.getElementById('neemTulsiValue').textContent = data.aggregated_quantities.neem_tulsi || 0;
    document.getElementById('waterValue').textContent = (data.aggregated_quantities.water || 0) + 'L';
    document.getElementById('greenTeaValue').textContent = data.aggregated_quantities.green_tea || 0;
    
    const caffeineAmount = data.aggregated_quantities.caffeine || 0;
    document.getElementById('caffeineValue').textContent = (caffeineAmount * 200) + 'mg';
    
    document.getElementById('noFearValue').textContent = data.aggregated_quantities.no_fear || 0;
}

function updateSleepSection(data) {
    const totalSleep = data.aggregated_quantities.sleep || 0;
    const weeklyGoal = 56; // 8 hours × 7 days
    const averageSleep = data.total_days > 0 ? (totalSleep / data.total_days).toFixed(1) : 0;
    
    document.getElementById('totalSleep').textContent = totalSleep;
    document.getElementById('averageSleep').textContent = averageSleep;
    
    // Update sleep progress
    const sleepPercentage = Math.min((totalSleep / weeklyGoal) * 100, 100);
    document.getElementById('sleepProgressFill').style.width = sleepPercentage + '%';
    
    const sleepRemaining = Math.max(weeklyGoal - totalSleep, 0);
    if (sleepRemaining > 0) {
        document.getElementById('sleepGoalStatus').textContent = `Need ${sleepRemaining} more hours`;
    } else {
        document.getElementById('sleepGoalStatus').textContent = 'Weekly goal achieved!';
    }
    
    // Create sleep trend chart
    createSleepTrendChart(data.daily_data);
}

function createSleepTrendChart(dailyData) {
    const ctx = document.getElementById('sleepTrendChart').getContext('2d');
    
    if (chartInstances.sleepTrend) {
        chartInstances.sleepTrend.destroy();
    }
    
    // Prepare daily sleep data
    const dates = [];
    const sleepValues = [];
    
    // Create a complete week of dates
    const weekRange = getCurrentWeekRange();
    const startDate = new Date(weekRange.start);
    
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        dates.push(currentDate.toLocaleDateString('en-US', { weekday: 'short' }));
        
        // Find sleep data for this date
        const dayData = dailyData.find(day => day.date === dateStr);
        sleepValues.push(dayData ? (dayData.quantities.sleep || 0) : 0);
    }
    
    chartInstances.sleepTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Sleep Hours',
                data: sleepValues,
                borderColor: '#667eea',
                backgroundColor: '#667eea20',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
            }, {
                label: 'Target (8h)',
                data: new Array(7).fill(8),
                borderColor: '#43e97b',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 12,
                    ticks: {
                        stepSize: 2,
                        callback: function(value) {
                            return value + 'h';
                        }
                    }
                }
            }
        }
    });
}

function createIdentitiesDailyChart(dailyData) {
    const ctx = document.getElementById('identitiesDailyChart').getContext('2d');
    
    if (chartInstances.identitiesDaily) {
        chartInstances.identitiesDaily.destroy();
    }
    
    // Prepare daily identities data
    const dates = [];
    const runnerValues = [];
    const engineeringValues = [];
    const algorithmValues = [];
    const teknokianValues = [];
    
    // Create a complete week of dates
    const weekRange = getCurrentWeekRange();
    const startDate = new Date(weekRange.start);
    
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        dates.push(currentDate.toLocaleDateString('en-US', { weekday: 'short' }));
        
        // Find data for this date
        const dayData = dailyData.find(day => day.date === dateStr);
        if (dayData && dayData.quantities) {
            runnerValues.push(dayData.quantities.runner || 0);
            engineeringValues.push(dayData.quantities.engineering || 0);
            algorithmValues.push(dayData.quantities.algorithm || 0);
            teknokianValues.push(dayData.quantities.teknokian || 0);
        } else {
            runnerValues.push(0);
            engineeringValues.push(0);
            algorithmValues.push(0);
            teknokianValues.push(0);
        }
    }
    
    chartInstances.identitiesDaily = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Runner',
                data: runnerValues,
                borderColor: '#ff6b6b',
                backgroundColor: '#ff6b6b20',
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                pointBackgroundColor: '#ff6b6b',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }, {
                label: 'Engineer',
                data: engineeringValues,
                borderColor: '#667eea',
                backgroundColor: '#667eea20',
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }, {
                label: 'Algorithm',
                data: algorithmValues,
                borderColor: '#43e97b',
                backgroundColor: '#43e97b20',
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                pointBackgroundColor: '#43e97b',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }, {
                label: 'Teknokian',
                data: teknokianValues,
                borderColor: '#ffd93d',
                backgroundColor: '#ffd93d20',
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                pointBackgroundColor: '#ffd93d',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return value;
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            elements: {
                point: {
                    hoverRadius: 8
                }
            }
        }
    });
}

function updateOtherActivities(data) {
    const podcastAmount = data.aggregated_quantities.podcast || 0;
    const financeAmount = data.aggregated_quantities.finance || 0;
    
    document.getElementById('podcastAmount').textContent = podcastAmount;
    document.getElementById('financeAmount').textContent = financeAmount;
    
    // Update trends
    document.getElementById('podcastTrend').textContent = `${podcastAmount} episodes this week`;
    document.getElementById('financeTrend').textContent = `${financeAmount} sessions this week`;
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