// Referral Link Module
import { state } from './settings.js';
import { showToast, openModal } from './ui.js';

export function openReferralModal() {
    const refCode = state.user?.referralCode || 'EXMPL';
    const refLink = `https://t.me/SupEarnBot?start=${refCode}`;

    openModal(`
        <div style="text-align: center;">
            <h2>👥 Invite & Earn</h2>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin: 10px 0;">Share your link and earn 50 bonus coins for every friend who joins!</p>
            <div class="glass-input" style="margin: 15px 0; font-size: 0.85rem; word-break: break-all;">${refLink}</div>
            <button id="copy-ref-btn" class="glass-button btn-primary btn-block">Copy Referral Link</button>
        </div>
    `);

    document.getElementById('copy-ref-btn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(refLink);
        showToast("Referral link copied to clipboard!", 'success');
    });
}