// Home Dashboard View
import { state } from './settings.js';

export function renderHomeView(container) {
    container.innerHTML = `
        <div class="animate-fade-in">
            <div class="glass-card" style="text-align: center; margin-bottom: 20px;">
                <p style="color: var(--text-muted); font-size: 0.85rem;">Total Balance</p>
                <h1 style="font-size: 2.5rem; margin: 10px 0; color: var(--accent-blue);">
                    🪙 <span id="coin-balance">${state.user?.coins || 0}</span>
                </h1>
                <p style="font-size: 0.8rem; color: var(--success);">≈ ₹${((state.user?.coins || 0) * 0.1).toFixed(2)} INR</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                <div class="glass-card" id="quick-watch-btn" style="cursor: pointer; text-align: center;">
                    <div style="font-size: 2rem;">📺</div>
                    <strong style="display: block; margin-top: 6px;">Watch Ads</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">+15 Coins / Ad</span>
                </div>
                <div class="glass-card" id="quick-daily-btn" style="cursor: pointer; text-align: center;">
                    <div style="font-size: 2rem;">📅</div>
                    <strong style="display: block; margin-top: 6px;">Daily Reward</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">Claim Daily Bonus</span>
                </div>
            </div>

            <div class="glass-card" id="quick-refer-btn" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>Invite Friends 👥</strong>
                    <p style="font-size: 0.75rem; color: var(--text-muted);">Get 50 coins per referral</p>
                </div>
                <button class="glass-button btn-gold" style="padding: 6px 12px; font-size: 0.8rem;">Invite</button>
            </div>
        </div>
    `;
}