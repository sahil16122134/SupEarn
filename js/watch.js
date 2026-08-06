// Adsgram Integration Module
import { state, updateUserCoins } from './settings.js';
import { db, doc, updateDoc, increment } from './firebase.js';
import { showToast } from './ui.js';

export function initAdsgram() {
    const AdController = window.Adsgram?.init({ blockId: "YOUR_ADSGRAM_BLOCK_ID" });

    return {
        showAd: async () => {
            if (!AdController) {
                showToast("Ad Provider not ready.", 'warning');
                return;
            }

            try {
                const result = await AdController.show();
                if (result.done) {
                    const reward = 15;
                    const userRef = doc(db, 'users', state.user.uid);
                    await updateDoc(userRef, { coins: increment(reward) });
                    updateUserCoins(reward);
                    showToast(`Ad watched! +${reward} coins received.`, 'success');
                }
            } catch (err) {
                showToast("Ad was skipped or failed to load.", 'error');
            }
        }
    };
}