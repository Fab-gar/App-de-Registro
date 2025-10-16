import { loadEntries } from './storage.js';
import { t, getLanguage } from './i18n.js';

// Hacemos la función global para poder llamarla desde el router
export function initializeCalendar() {
    const calendarContainer = document.getElementById('calendar');
    if (!calendarContainer) return; // No hacer nada si el calendario no está en la página

    // Inyectamos el HTML necesario para el calendario si no existe
    if (!document.getElementById('calendar-header')) {
        calendarContainer.innerHTML = `
            <div id="calendar-header" class="d-flex justify-content-between align-items-center mb-3">
                <button id="prev-month" class="btn btn-outline-primary">&lt;</button>
                <h3 id="month-year"></h3>
                <button id="next-month" class="btn btn-outline-primary">&gt;</button>
            </div>
            <div id="calendar-grid"></div>
            <div id="details-card" class="card mt-3" style="display: none;">
                <div class="card-header" id="details-card-header"></div>
                <div class="card-body" id="selected-day-details"></div>
            </div>
        `;
    }

    // Selectores de elementos del calendario
    const monthYearHeader = document.getElementById('month-year');
    const calendarGrid = document.getElementById('calendar-grid');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const detailsCard = document.getElementById('details-card');
    const detailsCardHeader = document.getElementById('details-card-header');
    const selectedDayDetails = document.getElementById('selected-day-details');

    let currentDate = new Date();

    const renderCalendar = (year, month) => {
        calendarGrid.innerHTML = '';
        // Leemos los datos FRESCOS de localStorage cada vez que renderizamos
        const allEntries = loadEntries();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        monthYearHeader.textContent = `${firstDay.toLocaleString(getLanguage(), { month: 'long' })} ${year}`;

        const table = document.createElement('table');
        table.className = 'calendar-table';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const dayNames = getLanguage() === 'es' ? ['D', 'L', 'M', 'X', 'J', 'V', 'S'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        dayNames.forEach(day => {
            const th = document.createElement('th');
            th.textContent = day;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        let date = 1;
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('tr');
            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('td');
                if (i === 0 && j < startDayOfWeek) {
                    cell.classList.add('other-month');
                } else if (date > daysInMonth) {
                    cell.classList.add('other-month');
                } else {
                    const cellDate = new Date(year, month, date);
                    const today = new Date();
                    if (date === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                        cell.classList.add('today');
                    }

                    const dateString = cellDate.toISOString().split('T')[0];
                    // Hacemos que todas las celdas de día válidas tengan su fecha
                    cell.dataset.date = dateString;

                    const entriesForDay = allEntries.filter(entry => entry.date === dateString);

                    if (entriesForDay.length > 0) {
                        cell.classList.add('has-entry');
                    }

                    cell.textContent = date;
                    date++;
                }
                row.appendChild(cell);
            }
            tbody.appendChild(row);
            if (date > daysInMonth) break;
        }
        table.appendChild(tbody);
        calendarGrid.appendChild(table);
    };

    const showDetails = (dateString) => {
        const entriesForDay = loadEntries().filter(entry => entry.date === dateString);
        if (entriesForDay.length === 0) {
            detailsCard.style.display = 'none';
            return;
        }

        let totalMinutes = 0, totalRevisits = 0, totalStudies = 0;
        entriesForDay.forEach(entry => {
            totalMinutes += (entry.hours * 60) + entry.minutes;
            totalRevisits += entry.revisits;
            totalStudies += entry.studies;
        });

        const finalHours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;

        const formattedDate = new Date(dateString + 'T00:00:00').toLocaleDateString(getLanguage(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        detailsCardHeader.innerHTML = t('detailsFor', { date: formattedDate });
        selectedDayDetails.innerHTML = `
            <p><i class="bi bi-stopwatch"></i> <strong>${t('totalTime')}</strong> ${finalHours}h ${remainingMinutes}m</p>
            <p><i class="bi bi-person-check"></i> <strong>${t('totalRevisits')}</strong> ${totalRevisits}</p>
            <p><i class="bi bi-book"></i> <strong>${t('totalStudies')}</strong> ${totalStudies}</p>
        `;
        detailsCard.style.display = 'block';
    };

    // Usamos delegación de eventos en el contenedor principal para que los listeners no se pierdan
    calendarContainer.onclick = (e) => {
        // Si se hace clic en una celda de día (que tenga data-date)
        if (e.target.matches('td[data-date]')) {
            const dateString = e.target.dataset.date;
            const hasEntry = e.target.classList.contains('has-entry');

            if (hasEntry) {
                // Si el día tiene registros, mostramos los detalles en la misma página
                showDetails(dateString);
            } else {
                // Si el día está vacío, vamos a la página de registro para añadir uno
                localStorage.setItem('selectedDateFromCalendar', dateString);
                window.location.hash = '#main';
            }
        }
        if (e.target.id === 'prev-month') {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
            detailsCard.style.display = 'none';
        }
        if (e.target.id === 'next-month') {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
            detailsCard.style.display = 'none';
        }
    };

    // Renderizado inicial del calendario
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
}
