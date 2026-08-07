/* ==========================================================================
   SupEarn — js/pages/daily.js
   Daily Login screen. Renders the 7-day streak calendar from live user
   state, requires a completed rewarded ad before claiming, and credits
   the reward atomically via claimDailyLoginTx (which also resets the
   streak server-side if a day was missed).
   ========================================================================== */

import { appState } from "../core/state.js";
import { claimDailyLoginTx } from "../core/firestore.js";
import { showRewardedAd, preloadMonetagAd } from "../services/ads-monetag.js";
import { renderBannerAd } from "../services/ads-tads.js";
import { requireOnline } from "../services/network.js";
import { toastError } from "../services/toast.js";
import { openModal } from "../components/modal.js";
import { triggerConfetti } from "../components/confetti.js";
import { flyCoinsToWallet } from "../components/coin-fly.js";
import { getTodayKey, getYesterdayKey } from "../core/utils.js";
import { hapticNotification } from "../core/telegram.js";

export async function render(container) {
  const unsubscribers = [];
  let isProcessing = false;

  function paint() {
    const settings = appState.get("settings") || {};
    const user = appState.get("appUser") || {};
    const rewards = settings.dailyRewardCoins || [10, 15, 20, 25, 30, 40, 60];

    const today = getTodayKey();
    const yesterday = getYesterdayKey();
    const claimedToday = user.lastDailyLogin === today;
    const continuing = user.lastDailyLogin === yesterday;
    const claimedCount = claimedToday ? user.dailyStreak || 0 : continuing ? user.dailyStreak || 0 : 0;
    const todayTargetDay = claimedToday ? null : (claimedCount % 7) + 1;
    const todayReward = todayTargetDay ? rewards[todayTargetDay - 1] || 0 : 0;

    const dayCells = Array.from({ length: 7 })
      .map((_, idx) => {
        const dayNum = idx + 1;
        const claimed = dayNum <= claimedCount;
        const isToday = !claimedToday && dayNum === todayTargetDay;
        const locked = !claimed && !isToday;
        const classes = ["streak-day", "streak-pop"];
        if (claimed) classes.push("is-claimed");
        if (isToday) classes.push("is-today");
        if (locked) classes.push("is-locked");

        return `
          <div class="${classes.join(" ")}" style="animation-delay:${idx * 60}ms;">
            ${claimed ? '<svg class="streak-check" viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" fill="currentColor"/></svg>' : ""}
            <span class="streak-day-label">Day ${dayNum}</span>
            <span class="streak-day-reward mono">${rewards[idx] || 0}</span>
          </div>
        `;
      })
      .join("");

    container.innerHTML = `
      <div class="glass-card" style="text-align:center;">
        <h3 style="margin-bottom:4px;">Daily Login Streak</h3>
        <p style="margin-bottom:18px;">Watch a short ad each day to keep your streak alive.</p>
        <div class="daily-streak-grid">${dayCells}</div>

        <div class="daily-streak-count">
          Current streak: <strong>${user.dailyStreak || 0} ${(user.dailyStreak || 0) === 1 ? "day" : "days"}</strong> 🔥
        </div>

        <button type="button" class="btn-glass btn-primary daily-claim-btn" id="daily-claim-btn" ${claimedToday ? "disabled" : ""}>
          ${claimedToday ? "Claimed Today ✅" : `Watch Ad to Claim +${todayReward} Coins`}
        </button>
      </div>
    `;

    if (claimedToday) return;

    const claimBtn = container.querySelector("#daily-claim-btn");

    if (settings.rewardedAdId) {
      preloadMonetagAd(settings.rewardedAdId);
    }

    claimBtn.addEventListener("click", async () => {
      if (isProcessing) return;
      if (!requireOnline()) return;
      if (!settings.rewardedAdId) {
        toastError("Ads aren't configured yet. Please try again later.");
        return;
      }

      isProcessing = true;
      claimBtn.disabled = true;
      claimBtn.textContent = "Loading Ad…";

      let watched = false;
      try {
        watched = await showRewardedAd(settings.rewardedAdId);
      } catch (err) {
        watched = false;
      }

      if (!watched) {
        isProcessing = false;
        claimBtn.disabled = false;
        claimBtn.textContent = `Watch Ad to Claim +${todayReward} Coins`;
        hapticNotification("error");
        showAdFailedPopup();
        return;
      }

      try {
        const firebaseUid = appState.get("firebaseUid");
        const rewardForDay = (dayNum) => rewards[dayNum - 1] || 0;
        const result = await claimDailyLoginTx(firebaseUid, getTodayKey(), getYesterdayKey(), rewardForDay);

        hapticNotification("success");
        flyCoinsToWallet(claimBtn, document.getElementById("header-avatar"), 8);
        triggerConfetti(36);
        showRewardPopup(result.reward, result.newStreakDay);
      } catch (err) {
        isProcessing = false;
        if (err && err.message === "ALREADY_CLAIMED_TODAY") {
          toastError("You've already claimed today's reward.");
        } else {
          hapticNotification("error");
          toastError("Couldn't claim your reward. Please try again.");
        }
        claimBtn.disabled = false;
        claimBtn.textContent = `Watch Ad to Claim +${todayReward} Coins`;
      }
    });
  }

  function showRewardPopup(amount, streakDay) {
    const settings = appState.get("settings") || {};
    openModal({
      autoCloseSeconds: settings.popupCloseSeconds || 5,
      bodyHtml: `
        <div style="text-align:center; padding-top:8px;">
          <div style="width:64px; height:64px; margin:0 auto 14px; border-radius:50%; background:var(--success-dim); display:flex; align-items:center; justify-content:center;">
            <svg viewBox="0 0 24 24" width="30" height="30"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" fill="var(--success)"/></svg>
          </div>
          <h3 style="margin-bottom:6px;">Day ${streakDay} Claimed!</h3>
          <p style="margin-bottom:16px;">You earned <strong class="mono" style="color:var(--accent-gold);">+${amount} coins</strong></p>
          <div class="banner-ad-slot is-empty" id="daily-popup-banner" style="min-height:60px;"></div>
        </div>
      `,
      onMount: (card) => {
        renderBannerAd(card.querySelector("#daily-popup-banner"), settings.bannerAdId);
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
          <p style="margin-bottom:16px;">You need to fully watch the ad to claim today's reward.</p>
          <button type="button" class="btn-glass btn-secondary" data-modal-cancel>Close</button>
        </div>
      `,
      onMount: (card, close) => {
        card.querySelector("[data-modal-cancel]").addEventListener("click", close);
      },
    });
  }

  paint();
  unsubscribers.push(appState.subscribe("appUser", () => {
    isProcessing = false;
    paint();
  }));

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}
