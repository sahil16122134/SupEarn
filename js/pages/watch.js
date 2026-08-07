/* ==========================================================================
   SupEarn — js/pages/watch.js
   Watch & Earn screen. Cooldown countdown, Monetag rewarded ad flow,
   atomic coin crediting only on confirmed ad completion, coin-fly +
   confetti reward popup with banner ad and auto-close countdown.
   ========================================================================== */

import { appState, formatCoins } from "../core/state.js";
import { creditWatchAdRewardTx } from "../core/firestore.js";
import { showRewardedAd, preloadMonetagAd } from "../services/ads-monetag.js";
import { renderBannerAd } from "../services/ads-tads.js";
import { requireOnline } from "../services/network.js";
import { toastError } from "../services/toast.js";
import { openModal } from "../components/modal.js";
import { triggerConfetti } from "../components/confetti.js";
import { flyCoinsToWallet } from "../components/coin-fly.js";
import { formatCountdown } from "../components/ui.js";
import { hapticNotification } from "../core/telegram.js";

export async function render(container) {
  const settings = appState.get("settings") || {};
  const user = appState.get("appUser") || {};

  let cooldownInterval = null;
  let isProcessing = false;

  container.innerHTML = `
    <div class="watch-screen">
      <div class="watch-hero-icon">
        <svg viewBox="0 0 24 24" width="52" height="52"><path d="M8 5v14l11-7z" fill="var(--accent-cyan)"/></svg>
      </div>
      <div class="watch-reward-amount mono">
        <svg viewBox="0 0 24 24" width="26" height="26"><circle cx="12" cy="12" r="10" fill="var(--accent-gold)"/><text x="12" y="16" font-size="11" text-anchor="middle" fill="#7a4e02" font-family="sans-serif" font-weight="700">C</text></svg>
        +${settings.watchRewardCoins || 0}
      </div>
      <div class="watch-reward-label">coins per rewarded ad</div>

      <button type="button" class="btn-glass btn-primary watch-btn" id="watch-ad-btn">
        Watch Ad
      </button>

      <div class="watch-cooldown-row hidden" id="watch-cooldown-row">
        <span class="watch-cooldown-label">Next rewarded ad available in</span>
        <span class="watch-cooldown-timer mono" id="watch-cooldown-timer">--</span>
      </div>

      <div class="watch-stats-strip">
        <div class="glass-card compact" style="text-align:center;">
          <div class="wallet-stat-label">Your Balance</div>
          <div class="wallet-stat-value mono" style="margin-top:4px;">${formatCoins(user.coinBalance)}</div>
        </div>
        <div class="glass-card compact" style="text-align:center;">
          <div class="wallet-stat-label">Lifetime Earned</div>
          <div class="wallet-stat-value earned mono" style="margin-top:4px;">${formatCoins(user.totalEarnedCoins)}</div>
        </div>
      </div>
    </div>
  `;

  const watchBtn = container.querySelector("#watch-ad-btn");
  const cooldownRow = container.querySelector("#watch-cooldown-row");
  const cooldownTimerEl = container.querySelector("#watch-cooldown-timer");

  if (settings.rewardedAdId) {
    preloadMonetagAd(settings.rewardedAdId);
  }

  function getCooldownRemainingSeconds() {
    const cooldownSeconds = settings.watchCooldownSeconds || 0;
    const lastAdTime = user.lastRewardedAdTime;
    if (!lastAdTime) return 0;
    const lastMs = typeof lastAdTime.toDate === "function" ? lastAdTime.toDate().getTime() : new Date(lastAdTime).getTime();
    const elapsedSeconds = (Date.now() - lastMs) / 1000;
    return Math.max(0, Math.ceil(cooldownSeconds - elapsedSeconds));
  }

  function tickCooldown() {
    const remaining = getCooldownRemainingSeconds();
    if (remaining <= 0) {
      cooldownRow.classList.add("hidden");
      watchBtn.disabled = false;
      watchBtn.classList.remove("is-disabled");
      watchBtn.textContent = "Watch Ad";
      if (cooldownInterval) {
        clearInterval(cooldownInterval);
        cooldownInterval = null;
      }
      return;
    }
    cooldownRow.classList.remove("hidden");
    cooldownTimerEl.textContent = formatCountdown(remaining);
    watchBtn.disabled = true;
    watchBtn.classList.add("is-disabled");
    watchBtn.textContent = "On Cooldown";
  }

  tickCooldown();
  if (getCooldownRemainingSeconds() > 0) {
    cooldownInterval = setInterval(tickCooldown, 1000);
  }

  watchBtn.addEventListener("click", async () => {
    if (isProcessing || watchBtn.disabled) return;
    if (!requireOnline()) return;
    if (!settings.rewardedAdId) {
      toastError("Ads aren't configured yet. Please try again later.");
      return;
    }

    isProcessing = true;
    watchBtn.disabled = true;
    watchBtn.textContent = "Loading Ad…";

    let watched = false;
    try {
      watched = await showRewardedAd(settings.rewardedAdId);
    } catch (err) {
      watched = false;
    }

    if (!watched) {
      watchBtn.disabled = false;
      watchBtn.textContent = "Watch Ad";
      isProcessing = false;
      hapticNotification("error");
      showAdFailedPopup();
      return;
    }

    try {
      const telegramId = appState.get("telegramUser").telegramId;
      const rewardAmount = settings.watchRewardCoins || 0;

      await creditWatchAdRewardTx(telegramId, rewardAmount, settings.watchCooldownSeconds || 0);

      // Keep this page's local snapshot in sync so the cooldown timer
      // reflects the watch that just happened, without waiting for the
      // next full page navigation to re-read appState.
      user.lastRewardedAdTime = { toDate: () => new Date() };

      hapticNotification("success");
      flyCoinsToWallet(watchBtn, document.getElementById("header-avatar"), 8);
      triggerConfetti(30);
      showRewardPopup(rewardAmount);
    } catch (err) {
      hapticNotification("error");
      if (err && err.message === "COOLDOWN_ACTIVE") {
        toastError("Please wait for the cooldown to finish before watching again.");
      } else {
        toastError("Couldn't credit your reward. Please try again.");
      }
    } finally {
      watchBtn.textContent = "Watch Ad";
      isProcessing = false;
      tickCooldown();
      if (!cooldownInterval && getCooldownRemainingSeconds() > 0) {
        cooldownInterval = setInterval(tickCooldown, 1000);
      }
    }
  });

  function showRewardPopup(amount) {
    const popupSettings = appState.get("settings") || {};
    openModal({
      autoCloseSeconds: popupSettings.popupCloseSeconds || 5,
      bodyHtml: `
        <div style="text-align:center; padding-top:8px;">
          <div style="width:64px; height:64px; margin:0 auto 14px; border-radius:50%; background:var(--success-dim); display:flex; align-items:center; justify-content:center;">
            <svg viewBox="0 0 24 24" width="30" height="30"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" fill="var(--success)"/></svg>
          </div>
          <h3 style="margin-bottom:6px;">Reward Received!</h3>
          <p style="margin-bottom:16px;">You earned <strong class="mono" style="color:var(--accent-gold);">+${amount} coins</strong></p>
          <div class="banner-ad-slot is-empty" id="watch-popup-banner" style="min-height:60px;"></div>
        </div>
      `,
      onMount: (card) => {
        renderBannerAd(card.querySelector("#watch-popup-banner"), popupSettings.bannerAdId);
      },
    });
  }

  function showAdFailedPopup() {
    openModal({
      bodyHtml: `
        <div style="text-align:center; padding-top:8px;">
          <div style="width:64px; height:64px; margin:0 auto 14px; border-radius:50%; background:var(--error-dim); display:flex; align-items:center; justify-content:center;">
            <svg viewBox="0 0 24 24" width="30" height="30"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="var(--error)"/></svg>
          </div>
          <h3 style="margin-bottom:6px;">Ad Not Completed</h3>
          <p style="margin-bottom:16px;">The ad was skipped, closed early, or failed to load, so no reward was given. Try again anytime.</p>
          <button type="button" class="btn-glass btn-secondary" data-modal-cancel>Close</button>
        </div>
      `,
      onMount: (card, close) => {
        card.querySelector("[data-modal-cancel]").addEventListener("click", close);
      },
    });
  }

  return () => {
    if (cooldownInterval) clearInterval(cooldownInterval);
  };
}
