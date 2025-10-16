import { loadPeople, savePeople } from './storage.js';
import { showConfirm } from './customAlert.js';
import { t, getLanguage } from './i18n.js';

export function initializePeoplePage() {
    const peopleListContainer = document.getElementById('people-list');
    // Obtenemos la instancia del modal de edición/creación
    const personModalElement = document.getElementById('person-details-modal');
    const personModal = bootstrap.Modal.getInstance(personModalElement) || new bootstrap.Modal(personModalElement);
    const personModalLabel = document.getElementById('personModalLabel');
    const savePersonBtn = document.getElementById('save-person-details-btn');

    if (!peopleListContainer) return;

    let people = loadPeople();

    peopleListContainer.innerHTML = ''; // Limpiamos la lista

    if (people.length === 0) {
        peopleListContainer.innerHTML = `<li class="list-group-item">${t('peopleListEmpty')}</li>`;
        return;
    }

    // Ordenamos por fecha más reciente primero
    people.sort((a, b) => new Date(b.date) - new Date(a.date));

    people.forEach(person => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item position-relative';
        listItem.dataset.personId = person.id;

        const typeBadge = person.type === 'studies'
            ? `<span class="badge bg-success">${t('menuStudies')}</span>`
            : `<span class="badge bg-info">${t('menuRevisits')}</span>`;

        const formattedDate = new Date(person.date + 'T00:00:00')
            .toLocaleDateString(getLanguage(), { day: 'numeric', month: 'short' })
            .replace('.', ''); // Elimina el punto final (ej: "oct." -> "oct")

        const collapseId = `person-collapse-${person.id}`;

        listItem.innerHTML = `
            <div class="person-item-header" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                <div class="d-flex w-100 justify-content-between align-items-start">
                    <h5 class="mb-1">${person.name}</h5>
                    <div>
                        <small class="me-2">${formattedDate}</small>
                        <i class="bi bi-chevron-down"></i>
                    </div>
                </div>
                ${typeBadge}
            </div>
            <div id="${collapseId}" class="collapse">
                <div class="person-details-body">
                    <p class="mb-1">${person.notes || '<em>Sin notas.</em>'}</p>
                    <div class="action-buttons mt-2">
                        <button class="btn btn-action" data-action="edit" title="Editar"><i class="bi bi-pencil-fill"></i></button>
                        <button class="btn btn-action btn-action-danger" data-action="delete" title="Eliminar"><i class="bi bi-trash-fill"></i></button>
                    </div>
                </div>
            </div>
        `;
        peopleListContainer.appendChild(listItem);
    });

    // Delegación de eventos para los botones de la lista
    peopleListContainer.addEventListener('click', async (e) => {
        const button = e.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const listItem = button.closest('li[data-person-id]');
        const personId = parseInt(listItem.dataset.personId, 10);
        let people = loadPeople(); // Recargamos por si acaso
        const person = people.find(p => p.id === personId);

        if (action === 'edit') {
            // Rellenar el modal con los datos de la persona
            document.getElementById('person-id').value = person.id;
            document.getElementById('person-type').value = person.type;
            document.getElementById('person-name').value = person.name;
            document.getElementById('person-notes').value = person.notes;
            
            // Actualizar títulos del modal
            personModalLabel.textContent = t('editPerson');
            savePersonBtn.textContent = t('saveChanges');

            personModal.show();
        }

        if (action === 'delete') {
            if (await showConfirm(t('confirmDeletePerson', { name: person.name }), t('alertConfirm'))) {
                const updatedPeople = people.filter(p => p.id !== personId);
                savePeople(updatedPeople);
                // Volvemos a renderizar la lista para que se actualice al instante
                initializePeoplePage(); 
            }
        }
    });
}