// UI Helper & Modal Management
import { triggerHaptic } from './telegram.js';

export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type} animate-fade-in`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span> ${message}`;
    
    container.appendChild(toast);
    triggerHaptic(type === 'error' ? 'error' : 'light');

    setTimeout(() => {
        toast.remove();
    }, 3500);
}

export function openModal(htmlContent) {
    const modal = document.getElementById('app-modal');
    const body = document.getElementById('modal-body');
    body.innerHTML = htmlContent;
    modal.classList.remove('hidden');
}

export function closeModal() {
    document.getElementById('app-modal').classList.add('hidden');
}

document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);