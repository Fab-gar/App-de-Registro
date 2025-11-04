import { loadEntries, saveEntries, loadPeople, savePeople, loadGoal, saveGoal } from './storage.js';
import { showAlert, showConfirm, showToast } from './customAlert.js';
import { t, getLanguage } from './i18n.js';

// --- State & Helpers ---
let isInitialized = false;

const formatTime = (totalMinutes) => {
    if (isNaN(totalMinutes) || totalMinutes < 0) return '0h 0m';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
};

// --- Exported Functions ---
export function updateMenuSummary() {
    const menuHoursSpan = document.getElementById('menu-total-hours');
    if (!menuHoursSpan) return;

    const allEntries = loadEntries();
    const now = new Date();
    const totalMinutesThisMonth = allEntries
        .filter(entry => {
            const entryDate = new Date(entry.date + 'T00:00:00');
            return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, entry) => sum + (entry.hours * 60) + entry.minutes, 0);

    menuHoursSpan.textContent = formatTime(totalMinutesThisMonth);
}

export function initializeMainPage(showForm = true) {
    // --- DOM Elements ---
    const dailyEntryColumn = document.getElementById('daily-entry-column');
    const summaryColumn = document.querySelector('#page-main .col-md-6:not(#daily-entry-column)');
    const activityForm = document.getElementById('activity-form');
    const dateDay = document.getElementById('date-day');
    const dateMonth = document.getElementById('date-month');
    const dateYear = document.getElementById('date-year');
    const dateInput = document.getElementById('current-date-input');
    const hoursInput = document.getElementById('hours');
    const minutesInput = document.getElementById('minutes');
    const revisitsInput = document.getElementById('revisits');
    const studiesInput = document.getElementById('studies');

    const prevDayBtn = document.getElementById('prev-day-btn');
    const nextDayBtn = document.getElementById('next-day-btn');
    const dailyEntriesList = document.getElementById('daily-entries');
    const clearDataBtn = document.getElementById('clear-data');
    const totalHoursSpan = document.getElementById('total-hours');
    const totalRevisitsSpan = document.getElementById('total-revisits');
    const totalStudiesSpan = document.getElementById('total-studies');

    const goalSelect = document.getElementById('goal-select');
    const goalProgressBar = document.getElementById('goal-progress-bar');
    const personModalElement = document.getElementById('person-details-modal');
    const personModal = new bootstrap.Modal(personModalElement);
    const personDetailsForm = document.getElementById('person-details-form');
    const savePersonBtn = document.getElementById('save-person-details-btn');
    const sendReportBtn = document.getElementById('send-report-btn');

    // --- UI Functions ---
    const updateDateDisplay = (dateString) => {
        const date = new Date(dateString + 'T00:00:00');
        dateDay.textContent = date.getDate();
        dateMonth.textContent = date.toLocaleDateString(getLanguage(), { month: 'short' }).toUpperCase();
        dateYear.textContent = date.getFullYear();
    };

    const loadDayData = (dateString) => {
        const entryForDay = loadEntries().find(entry => entry.date === dateString);
        if (entryForDay) {
            hoursInput.value = entryForDay.hours;
            minutesInput.value = entryForDay.minutes;
            revisitsInput.value = entryForDay.revisits;
            studiesInput.value = entryForDay.studies;
        } else {
            hoursInput.value = 0;
            minutesInput.value = 0;
            revisitsInput.value = 0;
            studiesInput.value = 0;
        }
    };

    const updateUI = () => {
        const allEntries = loadEntries();
        const currentMonth = new Date(dateInput.value).getMonth();
        const currentYear = new Date(dateInput.value).getFullYear();

        const monthEntries = allEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
        });

        let totalMinutes = 0, totalRevisits = 0, totalStudies = 0;
        dailyEntriesList.innerHTML = '';
        monthEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

        monthEntries.forEach(entry => {
            const entryMinutes = (entry.hours * 60) + entry.minutes;
            totalMinutes += entryMinutes;
            totalRevisits += entry.revisits;
            totalStudies += entry.studies;

            const listItem = document.createElement('li');
            listItem.className = 'list-group-item d-flex justify-content-between align-items-center flex-wrap';
            listItem.innerHTML = `
                <span>${new Date(entry.date + 'T00:00:00').toLocaleDateString(getLanguage(), { day: '2-digit', month: 'long' })}</span>
                <div>
                    <span class="badge bg-primary rounded-pill" title="Tiempo">${formatTime(entryMinutes)}</span>
                    <span class="badge bg-info rounded-pill">R: ${entry.revisits}</span>
                    <span class="badge bg-success rounded-pill">E: ${entry.studies}</span>
                </div>
            `;
            dailyEntriesList.appendChild(listItem);
        });

        totalHoursSpan.textContent = formatTime(totalMinutes);
        totalRevisitsSpan.textContent = totalRevisits;
        totalStudiesSpan.textContent = totalStudies;

        const goal = parseInt(goalSelect.value, 10);
        if (goal > 0) {
            const percentage = Math.min((totalMinutes / (goal * 60)) * 100, 100);
            goalProgressBar.style.width = `${percentage}%`;
            goalProgressBar.textContent = `${Math.round(percentage)}%`;
        } else {
            goalProgressBar.style.width = '0%';
            goalProgressBar.textContent = '0%';
        }
        updateMenuSummary();
    };

    // --- Event Listeners Setup (runs only once) ---
    const setupEventListeners = () => {
        if (isInitialized) return;

        // Form submission
        activityForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newEntry = {
                date: dateInput.value,
                hours: parseInt(hoursInput.value, 10) || 0,
                minutes: parseInt(minutesInput.value, 10) || 0,
                revisits: parseInt(revisitsInput.value, 10) || 0,
                studies: parseInt(studiesInput.value, 10) || 0,
            };

            const allEntries = loadEntries();
            const existingEntryIndex = allEntries.findIndex(entry => entry.date === newEntry.date);
            if (existingEntryIndex > -1) {
                allEntries[existingEntryIndex] = newEntry;
            } else {
                allEntries.push(newEntry);
            }

            saveEntries(allEntries);
            updateUI();
            
            showToast(t('toastDaySaved'));

            const currentDate = new Date(dateInput.value);
            currentDate.setDate(currentDate.getDate() + 1);
            const newDateString = currentDate.toISOString().split('T')[0];
            dateInput.value = newDateString;
            updateDateDisplay(newDateString);
        });

        // Date controls
        const changeDay = (amount) => {
            const currentDate = new Date(dateInput.value);
            currentDate.setDate(currentDate.getDate() + amount);
            const newDateString = currentDate.toISOString().split('T')[0];
            dateInput.value = newDateString;
            updateDateDisplay(newDateString);
            loadDayData(newDateString);
            // Llamamos a updateUI() para refrescar el resumen del mes si es necesario
            updateUI(); 
        };
        prevDayBtn.addEventListener('click', () => changeDay(-1));
        nextDayBtn.addEventListener('click', () => changeDay(1));

        dateInput.addEventListener('change', () => {
            updateDateDisplay(dateInput.value);
            loadDayData(dateInput.value);
            updateUI();
        });

        document.getElementById('date-display-clickable').addEventListener('click', (e) => {
            if (e.target.closest('button')) return; // No abrir si se hace clic en los botones
            dateInput.showPicker();
        });

        // Form controls (+/- buttons, etc.)
        activityForm.addEventListener('click', (e) => {
            const button = e.target.closest('[data-step-action]');
            if (!button) return;

            const action = button.dataset.stepAction;
            const targetId = button.dataset.stepTarget;

            if (targetId === 'minutes') {
                let totalMinutes = (parseInt(hoursInput.value, 10) * 60) + (parseInt(minutesInput.value, 10));
                totalMinutes += (action === 'plus' ? 5 : -5);
                if (totalMinutes < 0) totalMinutes = 0;
                hoursInput.value = Math.floor(totalMinutes / 60);
                minutesInput.value = totalMinutes % 60;            
            } else if (targetId === 'revisits' || targetId === 'studies') {
                const targetInput = document.getElementById(targetId);
                let currentValue = parseInt(targetInput.value, 10) || 0;
                if (action === 'plus') {
                    document.getElementById('person-type').value = targetId;
                    document.getElementById('personModalLabel').textContent = `Agregar ${targetId === 'revisits' ? 'Revisita' : 'Estudio'}`;
                    personDetailsForm.reset();
                    personModal.show();
                } else if (action === 'minus' && currentValue > 0) {
                    targetInput.value = currentValue - 1;
                }
            }
        });

        // Quick time add buttons
        document.getElementById('time-add-buttons').addEventListener('click', (e) => {
            if (e.target.matches('[data-add-minutes]')) {
                const minutesToAdd = parseInt(e.target.dataset.addMinutes, 10);
                let totalMinutes = (parseInt(hoursInput.value, 10) * 60) + parseInt(minutesInput.value, 10) + minutesToAdd;
                hoursInput.value = Math.floor(totalMinutes / 60);
                minutesInput.value = totalMinutes % 60;
            }
        });

        // Modal save button
        personDetailsForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevenimos el envío tradicional del formulario
            const type = document.getElementById('person-type').value;
            const name = document.getElementById('person-name').value;
            const notes = document.getElementById('person-notes').value.trim();

            // 1. Incrementar siempre el contador en la pantalla principal
            const targetInput = document.getElementById(type);
            targetInput.value = (parseInt(targetInput.value, 10) || 0) + 1;

            // 2. Solo guardar los detalles si se ha introducido un nombre o una nota
            if (name || notes) {
                const newPerson = {
                    id: Date.now(),
                    name: name,
                    notes: notes,
                    date: dateInput.value,
                    type: type
                };
                const people = loadPeople();
                people.push(newPerson);
                savePeople(people);
            }

            personModal.hide();
        });

        // Goal select
        goalSelect.addEventListener('change', () => {
            saveGoal(goalSelect.value);
            updateUI();
        });

        // Clear data button
        clearDataBtn.addEventListener('click', async () => {
            if (await showConfirm(t('alertConfirmDeleteAll'), t('alertConfirm'))) {
                localStorage.removeItem('activityEntries');
                localStorage.removeItem('peopleList');
                loadDayData(dateInput.value);
                updateUI();
            }
        });

        // Botón de Enviar Informe
        sendReportBtn.addEventListener('click', async () => {
            const monthName = new Date(dateInput.value).toLocaleDateString(getLanguage(), { month: 'long' });
            const hours = totalHoursSpan.textContent;
            const revisits = totalRevisitsSpan.textContent;
            const studies = totalStudiesSpan.textContent;

            const reportText = `*${t('reportTitle', { month: monthName.charAt(0).toUpperCase() + monthName.slice(1) })}*\n\n` +
                               `${t('summaryTotalHours')} ${hours}\n` +
                               `${t('summaryTotalRevisits')} ${revisits}\n` +
                               `${t('summaryTotalStudies')} ${studies}`;

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: t('reportTitle', { month: monthName }),
                        text: reportText,
                    });
                } catch (error) {
                    // El usuario canceló el diálogo de compartir, no es un error real.
                }
            } else {
                showAlert(t('shareNotSupported'), t('alertAttention'));
            }
        });

        isInitialized = true;
    };

    // --- Page Initialization Logic ---

    // 1. Adjust view (form vs. summary only)
    if (showForm) {
        dailyEntryColumn.style.display = 'block';
        summaryColumn.classList.remove('col-md-12');
        summaryColumn.classList.add('col-md-6');
    } else {
        dailyEntryColumn.style.display = 'none';
        summaryColumn.classList.remove('col-md-6');
        summaryColumn.classList.add('col-md-12');
    }

    // 2. Setup event listeners if not already done
    setupEventListeners();

    // 3. Set initial date
    const selectedDate = localStorage.getItem('selectedDateFromCalendar');
    if (selectedDate) {
        dateInput.value = selectedDate;
        localStorage.removeItem('selectedDateFromCalendar');
    } else if (!dateInput.value) { // Only set to today if it's not already set
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // 4. Load data and update UI for the current state
    updateDateDisplay(dateInput.value);
    goalSelect.value = loadGoal();
    updateUI();
}

// Oculta el loader si sigue visible cuando la página termina de cargar
window.addEventListener('load', () => {
    const loader = document.getElementById('loader-wrapper');
    if (loader) {
        // Aplicamos un desvanecimiento suave y luego lo quitamos del flujo
        loader.style.transition = 'opacity 0.5s ease-out';
        loader.style.opacity = '0';
        setTimeout(() => {
            if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, 600);
    }
});