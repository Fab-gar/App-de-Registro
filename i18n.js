import { languages } from './languages.js';

const SUPPORTED_LANGS = ['es', 'en'];
const LANG_KEY = 'app_language';
let translations = {};

/**
 * Carga las traducciones desde el objeto local.
 * @param {string} lang - El código del idioma (ej. 'es', 'en').
 */
function loadTranslations(lang) {
    translations = languages[lang] || languages['es'];
}

/**
 * Traduce una clave. Soporta interpolación simple.
 * @param {string} key - La clave de traducción.
 * @param {object} [vars={}] - Variables para reemplazar en el texto.
 * @returns {string} - El texto traducido.
 */
export function t(key, vars = {}) {
    let text = translations[key] || key;
    for (const [varKey, varValue] of Object.entries(vars)) {
        text = text.replace(`{${varKey}}`, varValue);
    }
    return text;
}

/**
 * Traduce todos los elementos de la página con el atributo `data-i18n`.
 */
export function translatePage() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const vars = element.dataset.i18nVars ? JSON.parse(element.dataset.i18nVars) : {};

        // Si el elemento es un span o no tiene otros elementos hijos, reemplazamos el contenido.
        // De lo contrario, asumimos que es un contenedor y buscamos un span dentro para traducir.
        if (element.tagName === 'SPAN' || element.children.length === 0) {
            element.innerHTML = t(key, vars);
        }
        // No hacemos nada para los contenedores complejos, ya que el texto está dentro de un <span> con su propio data-i18n
    });
}

/**
 * Establece el idioma de la aplicación.
 * @param {string} lang - El código del idioma.
 */
export function setLanguage(lang) {
    const language = SUPPORTED_LANGS.includes(lang) ? lang : 'es';
    localStorage.setItem(LANG_KEY, language);
    loadTranslations(language);
    document.documentElement.lang = language;
    translatePage();
}

/**
 * Obtiene el idioma actual guardado o el del navegador.
 * @returns {string}
 */
export function getLanguage() {
    return localStorage.getItem(LANG_KEY) || navigator.language.split('-')[0] || 'es';
}