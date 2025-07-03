// Daily Analytics JavaScript
let chartInstances = {};

document.addEventListener('DOMContentLoaded', function() {
    initializeDailyAnalytics();
    setupEventListeners();
    // Auto-generate analytics for today on load
    generateDailyAnalytics();
});

function initializeDailyAnalytics() {
    // Set default to 1 day (today)
    document.getElementById('daysInput').value = 1;
}

function setupEventListeners() {
    document.getElementById('generateDailyAnalytics').addEventListener('click', generateDailyAnalytics);
    
    // Quick days buttons
    document.querySelectorAll('.quick-days-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const days = this.dataset.days;
            setQuickDays(days);
        });
    });
}

function setQuickDays(days) {
    // Remove active class from all buttons
    document.querySelectorAll('.quick-days-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Set input value and generate analytics
    document.getElementById('daysInput').value = days;
    generateDailyAnalytics();
}

async function generateDailyAnalytics() {
    const daysInput = document.getElementById('daysInput').value;
    const days = parseInt(daysInput) || 1;
    
    if (days < 1 || days > 365) {
        showError('Please enter a valid number of days (1-365)');
        return;
    }
    
    showLoading(true);
    hideError();
    
    try {
        // Calculate date range
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
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
            displayDailyAnalytics(data);
        } else {
            showError(data.error || 'Failed to generate analytics');
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function displayDailyAnalytics(data) {
    // Update summary stats
    document.getElementById('totalDays').textContent = data.total_days;
    
    // Calculate most frequent identity
    const identities = ['runner', 'engineering', 'teknokian', 'algorithm'];
    let mostFrequentIdentity = '-';
    let maxCount = 0;
    
    identities.forEach(identity => {
        const count = data.aggregated_activities[identity] || 0;
        if (count > maxCount) {
            maxCount = count;
            mostFrequentIdentity = identity.charAt(0).toUpperCase() + identity.slice(1);
        }
    });
    
    document.getElementById('mostFrequentIdentity').textContent = mostFrequentIdentity;
    
    // Update identities amounts
    document.getElementById('runnerAmount').textContent = data.aggregated_quantities.runner || 0;
    document.getElementById('engineerAmount').textContent = data.aggregated_quantities.engineering || 0;
    document.getElementById('teknokianAmount').textContent = data.aggregated_quantities.teknokian || 0;
    document.getElementById('algorithmAmount').textContent = data.aggregated_quantities.algorithm || 0;
    
    // Update health values
    const wheyCount = data.aggregated_activities.whey_creatine || 0;
    const eggsAmount = data.aggregated_quantities.eggs || 0;
    const mealsAmount = data.aggregated_quantities.meals || 0;
    
    document.getElementById('eggsValue').textContent = eggsAmount;
    document.getElementById('wheyValue').textContent = wheyCount;
    document.getElementById('mealsValue').textContent = mealsAmount;
    
    // Calculate protein: (Whey × 25g) + (Eggs × 3.6g) + (Meals × 30g)
    const totalProtein = (wheyCount * 25) + (eggsAmount * 3.6) + (mealsAmount * 30);
    document.getElementById('proteinValue').textContent = Math.round(totalProtein) + 'g';
    
    document.getElementById('neemTulsiValue').textContent = data.aggregated_quantities.neem_tulsi || 0;
    document.getElementById('waterValue').textContent = (data.aggregated_quantities.water || 0) + 'L';
    document.getElementById('greenTeaValue').textContent = data.aggregated_quantities.green_tea || 0;
    
    // Calculate caffeine: Amount × 200mg
    const caffeineAmount = data.aggregated_quantities.caffeine || 0;
    document.getElementById('caffeineValue').textContent = (caffeineAmount * 200) + 'mg';
    
    document.getElementById('noFearValue').textContent = data.aggregated_quantities.no_fear || 0;
    
    // Update sleep
    const sleepAmount = data.aggregated_quantities.sleep || 0;
    document.getElementById('sleepAmount').textContent = sleepAmount;
    
    // Update sleep progress bar
    const sleepPercentage = Math.min((sleepAmount / 8) * 100, 100);
    document.getElementById('sleepBar').style.width = sleepPercentage + '%';
    
    // Update other activities
    document.getElementById('podcastAmount').textContent = data.aggregated_quantities.podcast || 0;
    document.getElementById('financeAmount').textContent = data.aggregated_quantities.finance || 0;
    
    // Create charts
    createIdentitiesCharts(data);
    
    // Show results
    document.getElementById('analyticsResults').classList.remove('hidden');
}

function createIdentitiesCharts(data) {
    // Prepare identities data
    const identitiesData = {
        runner: data.aggregated_quantities.runner || 0,
        engineering: data.aggregated_quantities.engineering || 0,
        teknokian: data.aggregated_quantities.teknokian || 0,
        algorithm: data.aggregated_quantities.algorithm || 0
    };
    
    const labels = ['Runner', 'Engineer', 'Teknokian', 'Algorithm'];
    const values = [
        identitiesData.runner,
        identitiesData.engineering,
        identitiesData.teknokian,
        identitiesData.algorithm
    ];
    
    const colors = ['#ff6b6b', '#667eea', '#ffd93d', '#43e97b'];
    
    // Histogram Chart
    const histogramCtx = document.getElementById('identitiesHistogram').getContext('2d');
    if (chartInstances.histogram) {
        chartInstances.histogram.destroy();
    }
    
    chartInstances.histogram = new Chart(histogramCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Amount',
                data: values,
                backgroundColor: colors.map(c => c + '80'),
                borderColor: colors,
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
    
    // Pie Chart
    const pieCtx = document.getElementById('identitiesPieChart').getContext('2d');
    if (chartInstances.pie) {
        chartInstances.pie.destroy();
    }
    
    // Filter out zero values for pie chart
    const nonZeroData = [];
    const nonZeroLabels = [];
    const nonZeroColors = [];
    
    values.forEach((value, index) => {
        if (value > 0) {
            nonZeroData.push(value);
            nonZeroLabels.push(labels[index]);
            nonZeroColors.push(colors[index]);
        }
    });
    
    if (nonZeroData.length > 0) {
        chartInstances.pie = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: nonZeroLabels,
                datasets: [{
                    data: nonZeroData,
                    backgroundColor: nonZeroColors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    } else {
        // Show "No data" message
        pieCtx.font = '16px Arial';
        pieCtx.fillStyle = '#666';
        pieCtx.textAlign = 'center';
        pieCtx.fillText('No identity data available', pieCtx.canvas.width / 2, pieCtx.canvas.height / 2);
    }
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