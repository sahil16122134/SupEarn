/* ==========================================================================
   SupEarn — js/pages/home.js
   Home screen: wallet card (signature element), the three action cards,
   and the banner ad slot. Subscribes to live user/settings state so the
   balance animates the moment a reward lands anywhere else in the app.
   ========================================================================== */

import { appState, formatCoins, formatRupees, redeemProgressPercent } from "../core/state.js";
import { navigateTo } from "../core/router.js";
import { renderBannerAd } from "../services/ads-tads.js";
import { pulseCounter } from "../components/coin-fly.js";
import { homeSkeleton } from "../components/skeleton.js";
import { hasClaimedToday, getNextStreakDay } from "../core/utils.js";
import { hapticSelection } from "../core/telegram.js";

export async function render(container) {
  container.innerHTML = homeSkeleton();

  const unsubscribers = [];
  let bannerCleanup = null;
  let previousBalance = null;

  function paint() {
    const user = appState.get("appUser");
    const settings = appState.get("settings");

    if (!user || !settings) {
      container.innerHTML = homeSkeleton();
      return;
    }

    const progressPct = redeemProgressPercent();
    const claimedToday = hasClaimedToday(user.lastDailyLogin);
    const nextDay = getNextStreakDay(user.lastDailyLogin, user.dailyStreak || 0);
    const todaysReward = (settings.dailyRewardCoins && settings.dailyRewardCoins[nextDay - 1]) || 0;

    container.innerHTML = `
      <div class="glass-card wallet-card tilt-card">
        <div class="aurora-glow"></div>
        <div class="wallet-card-inner">
          <div class="wallet-label">
            <svg viewBox="0 0 24 24" width="13" height="13"><path d="M20 6H4a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2zm-2 7a2 2 0 110-4 2 2 0 010 4z" fill="currentColor"/></svg>
            Wallet Balance
          </div>
          <div class="wallet-balance-row">
            <span class="wallet-balance mono" id="wallet-balance-value">${formatCoins(user.coinBalance)}</span>
            <span class="wallet-balance-unit">coins</span>
          </div>
          <div class="wallet-rupee-value">≈ <strong>${formatRupees(user.coinBalance)}</strong></div>

          <div class="wallet-stats-row">
            <div class="wallet-stat">
              <div class="wallet-stat-label">Lifetime Earned</div>
              <div class="wallet-stat-value earned mono">${formatCoins(user.totalEarnedCoins)}</div>
            </div>
            <div class="wallet-stat">
              <div class="wallet-stat-label">Lifetime Redeemed</div>
              <div class="wallet-stat-value redeemed mono">${formatCoins(user.totalRedeemedCoins)}</div>
            </div>
          </div>

          <div class="wallet-progress-block">
            <div class="wallet-progress-header">
              <span class="wallet-progress-title">Minimum Redeem ${formatRupees(settings.minimumUpiRedeem)}</span>
              <span class="wallet-progress-fraction mono">${formatCoins(user.coinBalance)} / ${formatCoins(settings.minimumUpiRedeem)}</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${progressPct}%;"></div>
            </div>
          </div>

          <button type="button" class="btn-glass btn-primary wallet-redeem-btn" id="home-redeem-btn">Redeem</button>
        </div>
      </div>

      <div class="page-section-title">Earn More</div>
      <div class="action-cards">
        <div class="glass-card action-card interactive" id="home-watch-card">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" width="24" height="24"><path d="M8 5v14l11-7z" fill="var(--accent-cyan)"/></svg>
          </div>
          <div class="action-body">
            <div class="action-title">Watch &amp; Earn</div>
            <div class="action-subtitle">Earn <span class="mono">${settings.watchRewardCoins}</span> coins per rewarded ad</div>
          </div>
          <svg class="action-chevron" viewBox="0 0 24 24" width="18" height="18"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>

        <div class="glass-card action-card interactive" id="home-daily-card">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" width="24" height="24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10z" fill="var(--accent-blue)"/></svg>
          </div>
          <div class="action-body">
            <div class="action-title">Daily Login${user.dailyStreak ? `<span class="action-streak-dot">${user.dailyStreak}🔥</span>` : ""}</div>
            <div class="action-subtitle">${claimedToday ? "Come back tomorrow for more" : `Today's reward: <span class="mono">${todaysReward}</span> coins`}</div>
          </div>
          <svg class="action-chevron" viewBox="0 0 24 24" width="18" height="18"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>

        <div class="glass-card action-card interactive" id="home-referral-card">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" width="24" height="24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="var(--accent-cyan)"/></svg>
          </div>
          <div class="action-body">
            <div class="action-title">Refer &amp; Earn</div>
            <div class="action-subtitle">Invite friends, earn <span class="mono">${settings.referralBonusCoins}</span> coins each</div>
          </div>
          <svg class="action-chevron" viewBox="0 0 24 24" width="18" height="18"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
      </div>

      <div class="banner-ad-slot is-empty" id="home-banner-slot"></div>
    `;

    container.querySelector("#home-redeem-btn").addEventListener("click", () => {
      hapticSelection();
      navigateTo("redeem");
    });
    container.querySelector("#home-watch-card").addEventListener("click", () => {
      hapticSelection();
      navigateTo("watch");
    });
    container.querySelector("#home-daily-card").addEventListener("click", () => {
      hapticSelection();
      navigateTo("daily");
    });
    container.querySelector("#home-referral-card").addEventListener("click", () => {
      hapticSelection();
      navigateTo("referral");
    });

    if (bannerCleanup) bannerCleanup();
    bannerCleanup = renderBannerAd(container.querySelector("#home-banner-slot"), settings.bannerAdId);

    // Animate the balance counter on subsequent updates (not the first paint).
    if (previousBalance !== null && previousBalance !== user.coinBalance) {
      const balanceEl = container.querySelector("#wallet-balance-value");
if (balanceEl) {
    pulseCounter(balanceEl);
}
    }
    previousBalance = user.coinBalance;
  }

  paint();
  unsubscribers.push(appState.subscribe("appUser", paint));
  unsubscribers.push(appState.subscribe("settings", paint));

  return () => {
    unsubscribers.forEach((unsub) => unsub());
    if (bannerCleanup) bannerCleanup();
  };
}
