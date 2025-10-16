import { initializeMainPage, updateMenuSummary } from './script.js';
import { initializeCalendar } from './calendar.js';
import { initializePeoplePage } from './people.js';
import { initializeTextsPage } from './texts.js';
import { setLanguage, getLanguage, translatePage } from './i18n.js';

document.addEventListener('DOMContentLoaded', () => {
    const pages = document.querySelectorAll('.page');
    // Variable para controlar la vista de la página principal
    let showFullMainPage = true;

    // Escuchamos los clics en el menú para decidir qué vista mostrar
    document.getElementById('page-menu').addEventListener('click', (e) => {
        // Si se hace clic en "Ver Resumen", solo mostramos el resumen.
        // Para cualquier otro enlace a #main, mostramos la página completa.
        showFullMainPage = e.target.id !== 'view-summary-btn';
    });

    // Inicializar el sistema de traducción ANTES de mostrar cualquier página
    setLanguage(getLanguage());

    function showPage(pageId) {
        // Oculta todas las páginas quitando la clase activa
        pages.forEach(page => {
            page.classList.remove('page-active');
        });

        // Muestra la página solicitada añadiendo la clase activa
        const pageToShow = document.getElementById(pageId);
        if (pageToShow) {
            pageToShow.classList.add('page-active');

            // Si estamos mostrando el menú, actualizamos su resumen
            if (pageId === 'page-menu') {
                updateMenuSummary();
            }

            // Si estamos mostrando la página de registro, la (re)inicializamos
            if (pageId === 'page-main') {
                initializeMainPage(showFullMainPage);
            }

            // Si estamos mostrando la página del calendario, la inicializamos/refrescamos
            if (pageId === 'page-calendar') {
                initializeCalendar();
            }

            // Si estamos mostrando la página de personas, la inicializamos
            if (pageId === 'page-people') {
                initializePeoplePage();
            }

            // Si estamos mostrando la página de textos, la inicializamos
            if (pageId === 'page-texts') {
                initializeTextsPage();
            }
        } else {
            // Si la página no existe, muestra el menú por defecto
            const menuPage = document.getElementById('page-menu');
            if (menuPage) {
                menuPage.classList.add('page-active');
            }
        }
    }

    function updateActiveNavLink(hash) {
        const navLinks = document.querySelectorAll('.navbar-custom .nav-link');
        
        // Quitamos la clase 'active' de todos los enlaces
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Buscamos el enlace que coincida con el hash actual y le añadimos la clase 'active'
        const activeLink = document.querySelector(`.navbar-custom .nav-link[href="#${hash}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    function handleRouteChange() {
        // Hacemos scroll hacia arriba en cada cambio de ruta
        window.scrollTo(0, 0);

        // Obtiene el "hash" de la URL (ej: #main) y le quita el #
        const hash = window.location.hash.substring(1);
        const pageId = `page-${hash}`;

        // Si no hay hash, vamos al menú
        if (!hash || hash === 'menu') {
            // Aseguramos que la URL vacía también vaya al menú
            showPage('page-menu');
            updateActiveNavLink(''); // Ningún enlace activo en el menú principal
        } else {
            showPage(pageId);
            updateActiveNavLink(hash); // Actualiza el enlace activo para la página actual
        }
    }

    // Escucha cambios en el hash de la URL
    window.addEventListener('hashchange', handleRouteChange);

    // Carga la página correcta al iniciar la app
    handleRouteChange();

    // Ocultar el loader después de que la app se haya cargado
    const loader = document.getElementById('loader-wrapper');
    if (loader) {
        // Esperamos un momento para que la primera página se renderice
        // y luego desvanecemos el loader.
        setTimeout(() => { loader.style.opacity = '0'; }, 200);
        setTimeout(() => { loader.style.display = 'none'; }, 700); // Lo eliminamos del DOM visual después de la transición
    }

    // --- LÓGICA DEL MODO OSCURO ---
    const themeToggle = document.getElementById('theme-toggle');
    const loaderLogo = document.querySelector('.loader-logo');
    const navbarLogo = document.querySelector('.navbar-logo');
    const body = document.body;

    // Función para aplicar el tema
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            if (loaderLogo) loaderLogo.src = 'logoclaro.png';
            if (navbarLogo) navbarLogo.src = 'logoclaro.png';
            themeToggle.checked = true;
        } else {
            body.classList.remove('dark-mode');
            // Asumiendo que el logo por defecto se llama 'logo.png'
            if (loaderLogo) loaderLogo.src = 'logo.png';
            if (navbarLogo) navbarLogo.src = 'logo.png';
            themeToggle.checked = false;
        }
    };

    // Cargar el tema al iniciar
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Prioridad: 1. Guardado, 2. Preferencia del SO, 3. Claro por defecto
    applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

    // Evento para el interruptor
    themeToggle.addEventListener('change', () => {
        const newTheme = themeToggle.checked ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    // --- LÓGICA DEL CAMBIO DE IDIOMA ---
    document.querySelector('.dropdown-menu').addEventListener('click', (e) => {
        const lang = e.target.getAttribute('data-lang');
        if (lang) {
            setLanguage(lang);
            // Forzar la reinicialización de las páginas para que se recarguen con el nuevo idioma
            handleRouteChange();
        }
    });
});

/**
 * Registra el Service Worker y configura las notificaciones periódicas.
 */
async function setupServiceWorker() {
    // 1. Comprobamos si el navegador soporta Service Workers
    if ('serviceWorker' in navigator) {
        try {
            // 2. Registramos nuestro archivo sw.js
            const registration = await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker registrado con éxito:', registration);

            // 3. Solicitamos permiso para mostrar notificaciones
            const permissionStatus = await Notification.requestPermission();
            if (permissionStatus === 'granted') {
                console.log('Permiso de notificación concedido.');

                // 4. Comprobamos si soporta Sincronización Periódica
                if ('periodicSync' in registration) {
                    const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
                    if (status.state === 'granted') {
                        // 5. Registramos una tarea periódica
                        await registration.periodicSync.register('check-monthly-notification', {
                            minInterval: 12 * 60 * 60 * 1000, // Mínimo 12 horas
                        });
                        console.log('Sincronización periódica registrada.');
                    }
                }
            }
        } catch (error) {
            console.error('Fallo al registrar el Service Worker:', error);
        }
    }
}

// Ejecutamos la configuración del Service Worker después de que la página cargue
window.addEventListener('load', setupServiceWorker);