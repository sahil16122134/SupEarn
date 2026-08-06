// Admin Panel Access Setup
import { showToast } from './ui.js';

export function setupAdminTriggers() {
    let clicks = 0;
    const triggerZone = document.getElementById('admin-trigger-zone');

    triggerZone?.addEventListener('click', () => {
        clicks++;
        if (clicks === 5) {
            clicks = 0;
            document.getElementById('admin-modal')?.classList.remove('hidden');
            showToast("Admin access triggered", 'info');
        }
    });

    document.getElementById('admin-modal-close')?.addEventListener('click', () => {
        document.getElementById('admin-modal')?.classList.add('hidden');
    });

    document.getElementById('admin-login-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast("Admin authenticated!", 'success');
        document.getElementById('admin-modal')?.classList.add('hidden');
    });
}