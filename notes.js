import { showAlert, showConfirm, showToast } from './customAlert.js';
import { t } from './i18n.js';

const NOTES_KEY = 'personalNotes';

function loadNotes() {
    return JSON.parse(localStorage.getItem(NOTES_KEY)) || [];
}

function saveNotes(notes) {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function initializeNotesPage() {
    const noteForm = document.getElementById('note-form');
    const noteContentInput = document.getElementById('note-content');
    const noteIdInput = document.getElementById('note-id');
    const notesList = document.getElementById('notes-list');
    const fabAddNote = document.getElementById('fab-add-note');

    function renderNotes() {
        const notes = loadNotes();
        notesList.innerHTML = '';

        if (notes.length === 0) {
            notesList.innerHTML = `<li class="list-group-item text-center text-muted" data-i18n="notesEmpty"></li>`;
            document.querySelector('[data-i18n="notesEmpty"]').textContent = t('notesEmpty');
            return;
        }

        notes.sort((a, b) => b.id - a.id); // Mostrar las más nuevas primero

        notes.forEach(note => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-start';
            li.innerHTML = `
                <div class="ms-2 me-auto">
                    <div class="fw-bold">${new Date(note.id).toLocaleString()}</div>
                    ${note.content.replace(/\n/g, '<br>')}
                </div>
                <div class="action-buttons">
                    <button class="btn-action edit-note-btn" data-id="${note.id}"><i class="bi bi-pencil-fill"></i></button>
                    <button class="btn-action btn-action-danger delete-note-btn" data-id="${note.id}"><i class="bi bi-trash3-fill"></i></button>
                </div>
            `;
            notesList.appendChild(li);
        });
    }

    noteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const content = noteContentInput.value.trim();
        const id = noteIdInput.value;

        if (!content) return;

        let notes = loadNotes();
        if (id) { // Editando
            const noteIndex = notes.findIndex(n => n.id == id);
            if (noteIndex > -1) {
                notes[noteIndex].content = content;
            }
        } else { // Creando
            notes.push({ id: Date.now(), content });
        }

        saveNotes(notes);
        showToast(t('noteSavedToast'));
        noteForm.reset();
        noteIdInput.value = '';
        renderNotes();
    });

    notesList.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-note-btn');
        const deleteBtn = e.target.closest('.delete-note-btn');

        if (editBtn) {
            const noteId = editBtn.dataset.id;
            const note = loadNotes().find(n => n.id == noteId);
            if (note) {
                noteIdInput.value = note.id;
                noteContentInput.value = note.content;
                noteContentInput.focus();
                window.scrollTo(0, 0);
            }
        }

        if (deleteBtn) {
            const noteId = deleteBtn.dataset.id;
            if (await showConfirm(t('confirmDeleteNote'), t('alertConfirm'))) {
                let notes = loadNotes();
                notes = notes.filter(n => n.id != noteId);
                saveNotes(notes);
                renderNotes();
            }
        }
    });

    fabAddNote.addEventListener('click', () => {
        // Limpiamos el formulario para asegurar que es una nota nueva
        noteForm.reset();
        noteIdInput.value = '';
        // Hacemos scroll hacia arriba y ponemos el foco en el campo de texto
        window.scrollTo({ top: 0, behavior: 'smooth' });
        noteContentInput.focus();
    });

    renderNotes();
}