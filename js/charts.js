// Training history data from training_history.json
const trainingData = {
    accuracy: [0.8591, 0.8602, 0.8630, 0.8649, 0.8656, 0.8668, 0.8708, 0.8726, 0.8754, 0.8733],
    val_accuracy: [0.8456, 0.8434, 0.8476, 0.8456, 0.8424, 0.8499, 0.8464, 0.8456, 0.8511, 0.8454],
    loss: [0.3445, 0.3447, 0.3377, 0.3295, 0.3308, 0.3301, 0.3208, 0.3173, 0.3146, 0.3144],
    val_loss: [0.3869, 0.3802, 0.3792, 0.3865, 0.3964, 0.3790, 0.3853, 0.3842, 0.3761, 0.3945]
};

// Chart.js default configuration
Chart.defaults.color = '#a0aec0';
Chart.defaults.borderColor = '#4a5568';
Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

/**
 * Create Training Progress Chart
 */
function createTrainingChart() {
    const ctx = document.getElementById('trainingChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            datasets: [
                {
                    label: 'Training Accuracy',
                    data: trainingData.accuracy.map(v => (v * 100).toFixed(2)),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Validation Accuracy',
                    data: trainingData.val_accuracy.map(v => (v * 100).toFixed(2)),
                    borderColor: '#48bb78',
                    backgroundColor: 'rgba(72, 187, 120, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + '%';
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Epoch',
                        font: {
                            size: 14
                        }
                    },
                    grid: {
                        color: 'rgba(74, 85, 104, 0.3)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Accuracy (%)',
                        font: {
                            size: 14
                        }
                    },
                    min: 80,
                    max: 90,
                    grid: {
                        color: 'rgba(74, 85, 104, 0.3)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

/**
 * Create Loss Metrics Chart
 */
function createLossChart() {
    const ctx = document.getElementById('lossChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            datasets: [
                {
                    label: 'Training Loss',
                    data: trainingData.loss.map(v => v.toFixed(4)),
                    borderColor: '#f56565',
                    backgroundColor: 'rgba(245, 101, 101, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Validation Loss',
                    data: trainingData.val_loss.map(v => v.toFixed(4)),
                    borderColor: '#ed8936',
                    backgroundColor: 'rgba(237, 137, 54, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Epoch',
                        font: {
                            size: 14
                        }
                    },
                    grid: {
                        color: 'rgba(74, 85, 104, 0.3)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Loss',
                        font: {
                            size: 14
                        }
                    },
                    grid: {
                        color: 'rgba(74, 85, 104, 0.3)'
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Initialize charts when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    createTrainingChart();
    createLossChart();
    console.log('✓ Charts initialized');
});
