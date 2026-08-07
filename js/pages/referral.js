/* ==========================================================================
   SupEarn — js/pages/referral.js
   Refer & Earn screen. Displays the user's referral link/code, wires copy
   and native Telegram share, and explains the one-time bonus mechanic.
   ========================================================================== */

import { appState } from "../core/state.js";
import { buildReferralLink, copyToClipboard, shareReferralLink, hapticImpact } from "../core/telegram.js";
import { toastSuccess, toastError } from "../services/toast.js";

export async function render(container) {
  const telegramUser = appState.get("telegramUser") || {};
  const settings = appState.get("settings") || {};
  const telegramId = telegramUser.telegramId || "";
  const referralLink = buildReferralLink(telegramId);
  const bonusCoins = settings.referralBonusCoins || 0;
  const tasksRequired = settings.referralTasksRequired || 4;

  container.innerHTML = `
    <div class="glass-card" style="text-align:center;">
      <div class="watch-hero-icon" style="width:88px; height:88px; margin:0 auto 16px;">
        <svg viewBox="0 0 24 24" width="40" height="40"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="var(--accent-cyan)"/></svg>
      </div>
      <h3 style="margin-bottom:6px;">Refer &amp; Earn</h3>
      <p>Invite friends to SupEarn. Once they complete ${tasksRequired} tasks, you earn <strong class="mono" style="color:var(--accent-gold);">+${bonusCoins} coins</strong> automatically.</p>
    </div>

    <div class="glass-card">
      <div class="page-section-title" style="margin:0 0 4px;">Your Referral Code</div>
      <div class="referral-code-box">
        <span class="referral-code-text mono">${escapeHtml(telegramId)}</span>
        <button type="button" class="btn-icon" id="copy-code-btn" aria-label="Copy referral code">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M16 1H4a2 2 0 00-2 2v14h2V3h12V1zm3 4H8a2 2 0 00-2 2v14a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2zm0 16H8V7h11v14z" fill="currentColor"/></svg>
        </button>
      </div>

      <div class="page-section-title" style="margin:16px 0 4px;">Your Referral Link</div>
      <div class="referral-code-box">
        <span class="referral-code-text mono">${escapeHtml(referralLink)}</span>
      </div>

      <div class="referral-actions">
        <button type="button" class="btn-glass btn-secondary" id="copy-link-btn">Copy Link</button>
        <button type="button" class="btn-glass btn-primary" id="share-link-btn">Share on Telegram</button>
      </div>

      <div class="referral-note">
        <svg viewBox="0 0 24 24" width="16" height="16" style="flex-shrink:0; margin-top:1px;"><path d="M11 7h2v2h-2V7zm0 4h2v6h-2v-6zm1-9a10 10 0 100 20 10 10 0 000-20z" fill="currentColor"/></svg>
        <span>Your friend must complete ${tasksRequired} tasks after joining through your link for you to receive the bonus.</span>
      </div>
    </div>

    <div class="glass-card">
      <div class="page-section-title" style="margin:0 0 10px;">How It Works</div>
      <div class="referral-progress-list">
        <div class="referral-progress-item is-done">
          <span class="referral-progress-dot">1</span>
          <span>Share your referral link with a friend</span>
        </div>
        <div class="referral-progress-item is-done">
          <span class="referral-progress-dot">2</span>
          <span>They open SupEarn through your link</span>
        </div>
        <div class="referral-progress-item">
          <span class="referral-progress-dot">3</span>
          <span>They complete ${tasksRequired} tasks in the app</span>
        </div>
        <div class="referral-progress-item">
          <span class="referral-progress-dot">4</span>
          <span>You automatically receive +${bonusCoins} coins</span>
        </div>
      </div>
    </div>
  `;

  container.querySelector("#copy-code-btn").addEventListener("click", async () => {
    hapticImpact("light");
    const ok = await copyToClipboard(telegramId);
    if (ok) toastSuccess("Referral code copied");
    else toastError("Couldn't copy to clipboard");
  });

  container.querySelector("#copy-link-btn").addEventListener("click", async () => {
    hapticImpact("light");
    const ok = await copyToClipboard(referralLink);
    if (ok) toastSuccess("Referral link copied");
    else toastError("Couldn't copy to clipboard");
  });

  container.querySelector("#share-link-btn").addEventListener("click", () => {
    hapticImpact("light");
    shareReferralLink(referralLink, "Join me on SupEarn and start earning real rewards! 🎉");
  });

  return () => {};
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}
