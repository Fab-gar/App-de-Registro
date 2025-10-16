import { loadTexts, saveTexts } from './storage.js';
import { showAlert, showConfirm } from './customAlert.js';
import { t } from './i18n.js';

let isTextsInitialized = false;

function setupTextEventListeners() {
    const textListContainer = document.getElementById('favorite-texts-list');
    const addTextBtn = document.getElementById('add-text-btn');

    // Obtenemos la instancia del modal
    const textModalElement = document.getElementById('text-modal');
    const textModal = new bootstrap.Modal(textModalElement);

    const textForm = document.getElementById('text-form');
    const textModalLabel = document.getElementById('textModalLabel');

    addTextBtn.addEventListener('click', () => {
        textForm.reset();
        document.getElementById('text-id').value = '';
        textModalLabel.textContent = t('modalAddTextTitle');
        textModal.show();
    });

    textForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('text-id').value;
        const reference = document.getElementById('text-reference').value;
        const description = document.getElementById('text-description').value;

        if (!reference) {
            showAlert(t('alertTextRefRequired'), t('alertAttention'));
            return;
        }

        let texts = loadTexts();
        if (id) { // Editando
            const index = texts.findIndex(t => t.id == id);
            if (index > -1) {
                texts[index] = { ...texts[index], reference, description };
            }
        } else { // Creando
            texts.push({ id: Date.now(), reference, description });
        }
        saveTexts(texts);
        renderTexts();
        textModal.hide();
    });

    textListContainer.addEventListener('click', async (e) => {
        const button = e.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const listItem = button.closest('li[data-text-id]');
        const textId = parseInt(listItem.dataset.textId, 10);
        let texts = loadTexts();
        const text = texts.find(t => t.id === textId);

        if (action === 'edit') {
            document.getElementById('text-id').value = text.id;
            document.getElementById('text-reference').value = text.reference;
            document.getElementById('text-description').value = text.description;
            textModalLabel.textContent = t('editText');
            textModal.show();
        } else if (action === 'delete') {
            if (await showConfirm(t('confirmDeleteText', { ref: text.reference }), t('alertConfirm'))) {
                const updatedTexts = texts.filter(t => t.id !== textId);
                saveTexts(updatedTexts);
                renderTexts();
            }
        }
    });

    isTextsInitialized = true;
}

function renderTexts() {
    const textListContainer = document.getElementById('favorite-texts-list');
    if (!textListContainer) return;

    const texts = loadTexts();
    textListContainer.innerHTML = '';

    if (texts.length === 0) {
        textListContainer.innerHTML = `<li class="list-group-item">${t('favTextsEmpty')}</li>`;
        return;
    }

    texts.forEach(text => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item';
        listItem.dataset.textId = text.id;

        const collapseId = `text-collapse-${text.id}`;

        listItem.innerHTML = `
            <div class="person-item-header" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                <div class="d-flex w-100 justify-content-between align-items-center">
                    <h5 class="mb-1 text-primary">${text.reference}</h5>
                    <i class="bi bi-chevron-down"></i>
                </div>
            </div>
            <div id="${collapseId}" class="collapse">
                <div class="person-details-body">
                    <p class="mb-1">${text.description.replace(/\n/g, '<br>') || '<em>Sin descripción.</em>'}</p>
                    <div class="action-buttons mt-2">
                        <button class="btn btn-action" data-action="edit" title="Editar"><i class="bi bi-pencil-fill"></i></button>
                        <button class="btn btn-action btn-action-danger" data-action="delete" title="Eliminar"><i class="bi bi-trash-fill"></i></button>
                    </div>
                </div>
            </div>
        `;
        textListContainer.appendChild(listItem);
    });
}

export function initializeTextsPage() {
    if (!isTextsInitialized) {
        setupTextEventListeners();
    }
    renderTexts();
}