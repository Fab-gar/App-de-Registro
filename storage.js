/**
 * Módulo de almacenamiento de datos.
 * Centraliza todas las operaciones de lectura y escritura en localStorage.
 */

const ENTRIES_KEY = 'activityEntries';
const PEOPLE_KEY = 'peopleList';
const GOAL_KEY = 'monthlyGoal';
const TEXTS_KEY = 'favoriteTexts';

// --- Entradas de Actividad ---

export function loadEntries() {
    const entries = localStorage.getItem(ENTRIES_KEY);
    return entries ? JSON.parse(entries) : [];
}

export function saveEntries(entries) {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

// --- Personas (Revisitas/Estudios) ---

export function loadPeople() {
    const people = localStorage.getItem(PEOPLE_KEY);
    return people ? JSON.parse(people) : [];
}

export function savePeople(people) {
    localStorage.setItem(PEOPLE_KEY, JSON.stringify(people));
}

// --- Meta Mensual ---

export function loadGoal() {
    return localStorage.getItem(GOAL_KEY) || '0';
}

export function saveGoal(goal) {
    localStorage.setItem(GOAL_KEY, goal);
}

// --- Textos Favoritos ---

export function loadTexts() {
    const texts = localStorage.getItem(TEXTS_KEY);
    return texts ? JSON.parse(texts) : [];
}

export function saveTexts(texts) {
    localStorage.setItem(TEXTS_KEY, JSON.stringify(texts));
}