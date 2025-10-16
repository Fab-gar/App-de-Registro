/**
 * Módulo para mostrar alertas y confirmaciones personalizadas usando modales de Bootstrap.
 */

const modalElement = document.getElementById('custom-alert-modal');
const customModal = new bootstrap.Modal(modalElement);
const modalTitle = document.getElementById('customAlertModalLabel');
const modalBody = document.getElementById('custom-alert-modal-body');
const modalFooter = document.getElementById('custom-alert-modal-footer');

/**
 * Muestra una alerta personalizada.
 * @param {string} message El mensaje a mostrar.
 * @param {string} [title='Atención'] El título del modal.
 */
export function showAlert(message, title = 'Atención') {
    return new Promise((resolve) => {
        modalTitle.textContent = title;
        modalBody.innerHTML = `<p>${message}</p>`;
        modalFooter.innerHTML = '<button type="button" class="btn btn-primary" id="alert-ok-btn">Aceptar</button>';

        const okBtn = document.getElementById('alert-ok-btn');

        const onOk = () => {
            okBtn.removeEventListener('click', onOk);
            resolve();
            customModal.hide();
        };

        okBtn.addEventListener('click', onOk);
        modalElement.addEventListener('hidden.bs.modal', onOk, { once: true });

        customModal.show();
    });
}

/**
 * Muestra un diálogo de confirmación personalizado.
 * @param {string} message La pregunta de confirmación.
 * @param {string} [title='Confirmar'] El título del modal.
 * @returns {Promise<boolean>} Resuelve a `true` si el usuario confirma, `false` si cancela.
 */
export function showConfirm(message, title = 'Confirmar') {
    return new Promise((resolve) => {
        modalTitle.textContent = title;
        modalBody.innerHTML = `<p>${message}</p>`;
        modalFooter.innerHTML = `
            <button type="button" class="btn btn-secondary" id="confirm-cancel-btn">Cancelar</button>
            <button type="button" class="btn btn-primary" id="confirm-ok-btn">Confirmar</button>
        `;

        const okBtn = document.getElementById('confirm-ok-btn');
        const cancelBtn = document.getElementById('confirm-cancel-btn');

        const cleanup = () => {
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
        };

        const onOk = () => {
            cleanup();
            resolve(true);
            customModal.hide();
        };

        const onCancel = () => {
            cleanup();
            resolve(false);
            customModal.hide();
        };

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        modalElement.addEventListener('hidden.bs.modal', onCancel, { once: true });

        customModal.show();
    });
}

/**
 * Muestra una notificación temporal (toast).
 * @param {string} message El mensaje a mostrar.
 * @param {string} [type='success'] El tipo de toast ('success', 'info', 'warning', 'danger').
 */
export function showToast(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;

    const toastId = 'toast-' + Date.now();
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);

    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 }); // 3 segundos
    toast.show();

    // Limpiar el elemento del DOM después de que se oculte
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}