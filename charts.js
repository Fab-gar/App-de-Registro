import { loadEntries } from './storage.js';
import { t, getLanguage } from './i18n.js';

let monthlyChart = null;
let trendChart = null;

function getChartColors() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    return {
        textColor: isDarkMode ? '#f0f2f5' : '#333',
        gridColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        // Colores de Bootstrap para consistencia
        blue: '#4a90e2',
        cyan: '#50E3C2',
        green: '#7ED321',
        yellow: '#F5A623',
        red: '#D0021B'
    };
}

function renderMonthlyDistributionChart() {
    const ctx = document.getElementById('monthlyDistributionChart')?.getContext('2d');
    if (!ctx) return;

    const entries = loadEntries();
    const now = new Date();
    const currentMonthEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date + 'T00:00:00');
        return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
    });

    const totals = currentMonthEntries.reduce((acc, entry) => {
        acc.hours += entry.hours + (entry.minutes / 60);
        acc.revisits += entry.revisits;
        acc.studies += entry.studies;
        return acc;
    }, { hours: 0, revisits: 0, studies: 0 });

    const colors = getChartColors();

    if (monthlyChart) {
        monthlyChart.destroy();
    }

    monthlyChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [t('menuHours'), t('menuRevisits'), t('menuStudies')],
            datasets: [{
                label: t('chartsMonthlyDistribution'),
                data: [totals.hours.toFixed(1), totals.revisits, totals.studies],
                backgroundColor: [colors.blue, colors.cyan, colors.green],
                borderColor: document.body.classList.contains('dark-mode') ? '#353941' : '#eef2f5',
                borderWidth: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: colors.textColor
                    }
                }
            }
        }
    });
}

function renderHoursTrendChart() {
    const ctx = document.getElementById('hoursTrendChart')?.getContext('2d');
    if (!ctx) return;

    const entries = loadEntries();
    const monthlyData = {};

    // Agrupar horas por mes
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthName = d.toLocaleDateString(getLanguage(), { month: 'short' });
        monthlyData[monthKey] = { hours: 0, label: monthName };
    }

    entries.forEach(entry => {
        const entryDate = new Date(entry.date + 'T00:00:00');
        const monthKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[monthKey]) {
            monthlyData[monthKey].hours += entry.hours + (entry.minutes / 60);
        }
    });

    const labels = Object.values(monthlyData).map(d => d.label);
    const data = Object.values(monthlyData).map(d => d.hours.toFixed(1));
    const colors = getChartColors();

    if (trendChart) {
        trendChart.destroy();
    }

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: t('menuHours'),
                data: data,
                fill: true,
                borderColor: colors.blue,
                backgroundColor: 'rgba(74, 144, 226, 0.2)',
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: colors.textColor },
                    grid: { color: colors.gridColor }
                },
                x: {
                    ticks: { color: colors.textColor },
                    grid: { color: colors.gridColor }
                }
            }
        }
    });
}

export function initializeChartsPage() {
    renderMonthlyDistributionChart();
    renderHoursTrendChart();
}