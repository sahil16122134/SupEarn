// Task Center View
import { state, updateUserCoins } from './settings.js';
import { db, doc, updateDoc, increment } from './firebase.js';
import { showToast } from './ui.js';

export function renderTasksView(container) {
    container.innerHTML = `
        <div class="animate-fade-in">
            <h2 style="margin-bottom: 16px;">Available Tasks</h2>
            <div id="tasks-list" style="display: flex; flex-direction: column; gap: 12px;">
                <div class="glass-card" style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>Join Telegram Channel</strong>
                        <p style="font-size: 0.75rem; color: var(--text-muted);">+50 Coins</p>
                    </div>
                    <button class="glass-button btn-primary task-claim-btn" data-reward="50">Complete</button>
                </div>
                <div class="glass-card" style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>Follow Us on Twitter</strong>
                        <p style="font-size: 0.75rem; color: var(--text-muted);">+30 Coins</p>
                    </div>
                    <button class="glass-button btn-primary task-claim-btn" data-reward="30">Complete</button>
                </div>
            </div>
        </div>
    `;

    container.querySelectorAll('.task-claim-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const reward = parseInt(e.target.dataset.reward, 10);
            e.target.disabled = true;
            e.target.innerText = "Claiming...";

            try {
                const userRef = doc(db, 'users', state.user.uid);
                await updateDoc(userRef, { coins: increment(reward) });
                updateUserCoins(reward);
                showToast(`Task completed! +${reward} coins earned!`, 'success');
                e.target.innerText = "Done ✅";
            } catch (err) {
                showToast("Failed to claim task reward.", 'error');
                e.target.disabled = false;
            }
        });
    });
}