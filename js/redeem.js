// Cashout & Withdrawals Module
import { state } from './settings.js';
import { showToast, openModal, closeModal } from './ui.js';

export function openRedeemModal() {
    const options = state.withdrawalMethods.map(m => `
        <div class="glass-card" style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>${m.icon} ${m.name}</strong>
                <p style="font-size: 0.72rem; color: var(--text-muted);">Min: ${m.minCoins} Coins</p>
            </div>
            <button class="glass-button btn-primary select-payout-btn" data-id="${m.id}" style="padding: 6px 12px; font-size: 0.8rem;">Withdraw</button>
        </div>
    `).join('');

    openModal(`
        <h3>Withdraw Rewards</h3>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 15px;">Convert your hard-earned coins into real payouts.</p>
        <div>${options}</div>
    `);

    document.querySelectorAll('.select-payout-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const method = state.withdrawalMethods.find(m => m.id === id);
            
            if (state.user.coins < method.minCoins) {
                showToast(`Minimum ${method.minCoins} coins required!`, 'warning');
                return;
            }

            showToast(`Withdrawal request submitted via ${method.name}!`, 'success');
            closeModal();
        });
    });
}