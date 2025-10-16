/**
 * Service Worker para notificaciones mensuales.
 */

const NOTIFICATION_TAG = 'monthly-report-reminder';

// Se ejecuta cuando el Service Worker se activa.
self.addEventListener('activate', (event) => {
    console.log('Service Worker activado.');
});

/**
 * Comprueba si es el primer día del mes y muestra una notificación si corresponde.
 */
async function checkAndSendNotification() {
    const today = new Date();
    const dayOfMonth = today.getDate();

    // Solo queremos que se ejecute el primer día del mes.
    if (dayOfMonth !== 1) {
        console.log('Hoy no es el primer día del mes. No se envía notificación.');
        return;
    }

    const lastNotificationKey = `last_notification_${today.getFullYear()}_${today.getMonth()}`;
    const lastNotificationSent = await self.caches.match(lastNotificationKey);

    // Si ya se envió una notificación para este mes, no hacemos nada.
    if (lastNotificationSent) {
        console.log('La notificación para este mes ya fue enviada.');
        return;
    }

    console.log('Enviando notificación mensual...');

    // Mostramos la notificación
    await self.registration.showNotification('Registro de Actividad', {
        body: '¡Es el primer día del mes! No olvides enviar tu informe.',
        icon: 'logo.png', // Usamos el logo de la app como icono
        tag: NOTIFICATION_TAG, // Etiqueta para agrupar notificaciones
    });

    // Marcamos que la notificación para este mes ya se ha enviado.
    await self.caches.open('notification-status').then(cache => cache.put(lastNotificationKey, new Response('sent')));
}

// Escuchamos el evento 'periodicsync' que el navegador disparará periódicamente.
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-monthly-notification') {
        event.waitUntil(checkAndSendNotification());
    }
});