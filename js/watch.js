import { state, updateUserCoins } from './settings.js';
import { db, doc, updateDoc, increment } from './firebase.js';
import { showToast } from './ui.js';

export function initAdsgram() {
    return {
        showAd: async () => {
            if (!window.Adsgram) {
                showToast("Adsgram SDK not available (Demo Reward Granted)", 'info');
                applyReward(15);
                return true;
            }

            try {
                const AdController = window.Adsgram.init({ blockId: "YOUR_ADSGRAM_BLOCK_ID" });
                const result = await AdController.show();
                if (result.done) {
                    await applyReward(15);
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
    return {
        showAd: async () => {
            if (!window.Adeasly) {
                showToast("Adeasly SDK not available (Demo Reward Granted)", 'info');
                applyReward(15);
                return true;
            }

            try {
                const AdController = window.Adeasly.init({ blockId: "YOUR_ADEASLY_BLOCK_ID" });
                const result = await AdController.show();
                if (result.done) {
                    await applyReward(15);
                    return true;
                }
            } catch (err) {
                showToast("Adeasly ad skipped or failed.", 'error');
            }
            return false;
        }
    };
}

async function applyReward(amount) {
    updateUserCoins(amount);
    
    if (db && state.user?.uid && !state.user.uid.startsWith('dev_')) {
        try {
            const userRef = doc(db, 'users', state.user.uid);
            await updateDoc(userRef, { coins: increment(amount) });
        } catch (e) {
            console.warn("Could not sync reward to Firestore", e);
        }
    } else {
        localStorage.setItem('supearn_mock_user', JSON.stringify(state.user));
    }
    
    showToast(`Ad watched! +${amount} coins received.`, 'success');
    const balanceElem = document.getElementById('coin-balance');
    if (balanceElem) balanceElem.innerText = state.user.coins;
}
