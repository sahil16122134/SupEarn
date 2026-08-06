// Daily Reward Calendar
import { state, updateUserCoins } from './settings.js';
import { showToast, openModal, closeModal } from './ui.js';
import { db, doc, updateDoc, increment } from './firebase.js';

export function openDailyBonusModal() {
    const modalContent = `
        <div style="text-align: center;">
            <h2>📅 Daily Bonus</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">Claim daily rewards to build your streak!</p>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
                <div class="glass-card" style="padding: 10px;">Day 1<br><strong>+10</strong></div>
                <div class="glass-card" style="padding: 10px;">Day 2<br><strong>+20</strong></div>
                <div class="glass-card" style="padding: 10px;">Day 3<br><strong>+30</strong></div>
            </div>
            <button id="claim-daily-btn" class="glass-button btn-gold btn-block">Claim 20 Coins</button>
        </div>
    `;
    openModal(modalContent);

    document.getElementById('claim-daily-btn')?.addEventListener('click', async () => {
        try {
            const reward = 20;
            const userRef = doc(db, 'users', state.user.uid);
            await updateDoc(userRef, { coins: increment(reward) });
            updateUserCoins(reward);
            showToast(`Daily Bonus Claimed! +${reward} Coins`, 'success');
            closeModal();
        } catch (err) {
            showToast("Error claiming daily reward", 'error');
        }
    });
}