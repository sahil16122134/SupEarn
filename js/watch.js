// Dual Ad Provider Integration Module (Adsgram + Adeasly)
import { state, updateUserCoins } from './settings.js';
import { db, doc, updateDoc, increment } from './firebase.js';
import { showToast } from './ui.js';

export function initAdsgram() {
    const AdController = window.Adsgram?.init({ blockId: "YOUR_ADSGRAM_BLOCK_ID" });

    return {
        showAd: async () => {
            if (!AdController) {
                showToast("Adsgram Provider not ready.", 'warning');
                return false;
            }

            try {
                const result = await AdController.show();
                if (result.done) {
                    const reward = 15;
                    const userRef = doc(db, 'users', state.user.uid);
                    await updateDoc(userRef, { coins: increment(reward) });
                    updateUserCoins(reward);
                    showToast(`Ad watched! +${reward} coins received.`, 'success');
                    return true;
                }
            } catch (err) {
                showToast("Adsgram ad skipped or failed.", 'error');
            }
            return false;
        }
    };
}

export function initAdeasly() {
    const AdController = window.Adeasly?.init({ blockId: "YOUR_ADEASLY_BLOCK_ID" });

    return {
        showAd: async () => {
            if (!AdController) {
                showToast("Adeasly Provider not ready.", 'warning');
                return false;
            }

            try {
                const result = await AdController.show();
                if (result.done) {
                    const reward = 15;
                    const userRef = doc(db, 'users', state.user.uid);
                    await updateDoc(userRef, { coins: increment(reward) });
                    updateUserCoins(reward);
                    showToast(`Ad watched! +${reward} coins received.`, 'success');
                    return true;
                }
            } catch (err) {
                showToast("Adeasly ad skipped or failed.", 'error');
            }
            return false;
        }
    };
}
