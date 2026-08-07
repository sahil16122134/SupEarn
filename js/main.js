/* ==========================================================================
   SupEarn — js/main.js
   Application entry point. Runs the startup chain described in the spec:
   Telegram Login → Firebase Auth → Firestore User Check → Create User →
   Load Settings → Load Wallet → Load Home — then wires every global
   service (router, network monitor, global UI effects, pull-to-refresh,
   header, hidden admin gesture) exactly once.
   ========================================================================== */

import { isInsideTelegram, initTelegram, openTelegramBotLink, hapticImpact } from "./core/telegram.js";
import { bootstrapTelegramAuth, AuthError } from "./core/auth.js";
import { subscribeUser, subscribeSettings } from "./core/firestore.js";
import { appState } from "./core/state.js";
import { initRouter, navigateTo, refreshCurrentPage } from "./core/router.js";
import { initNetworkMonitor } from "./services/network.js";
import { initGlobalUI } from "./components/ui.js";
import { attachPullToRefresh } from "./components/pull-to-refresh.js";

import * as homePage from "./pages/home.js";
import * as tasksPage from "./pages/tasks.js";
import * as watchPage from "./pages/watch.js";
import * as dailyPage from "./pages/daily.js";
import * as referralPage from "./pages/referral.js";
import * as redeemPage from "./pages/redeem.js";
import * as profilePage from "./pages/profile.js";
import * as adminPage from "./pages/admin.js";
import * as privacyPage from "./pages/footer/privacy.js";
import * as termsPage from "./pages/footer/terms.js";
import * as faqPage from "./pages/footer/faq.js";
import * as aboutPage from "./pages/footer/about.js";
import * as contactPage from "./pages/footer/contact.js";
import * as disclaimerPage from "./pages/footer/disclaimer.js";

const PAGE_REGISTRY = {
  home: homePage,
  tasks: tasksPage,
  watch: watchPage,
  daily: dailyPage,
  referral: referralPage,
  redeem: redeemPage,
  profile: profilePage,
  admin: adminPage,
  privacy: privacyPage,
  terms: termsPage,
  faq: faqPage,
  about: aboutPage,
  contact: contactPage,
  disclaimer: disclaimerPage,
};

const splashEl = document.getElementById("splash-screen");
const splashStatusEl = document.getElementById("splash-status");
const outsideScreenEl = document.getElementById("outside-telegram-screen");
const appEl = document.getElementById("app");

function setSplashStatus(text) {
  if (splashStatusEl) splashStatusEl.textContent = text;
}

function showOutsideTelegramScreen() {
  splashEl.classList.add("is-leaving");
  outsideScreenEl.classList.remove("hidden");
  const openBtn = document.getElementById("open-telegram-bot-btn");
  openBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openTelegramBotLink();
  });
}

function showSplashError(message, onRetry) {
  const content = document.querySelector(".splash-content");
  content.innerHTML = `
    <div style="width:64px; height:64px; border-radius:50%; background:rgba(248,113,113,0.14); display:flex; align-items:center; justify-content:center; margin-bottom:16px;">
      <svg viewBox="0 0 24 24" width="30" height="30"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#f87171"/></svg>
    </div>
    <h3 style="margin-bottom:8px; text-align:center;">Couldn't Start SupEarn</h3>
    <p style="text-align:center; margin-bottom:20px; max-width:280px;">${escapeHtml(message)}</p>
    <button type="button" class="btn-glass btn-primary" id="splash-retry-btn" style="width:220px;">Retry</button>
  `;
  document.getElementById("splash-retry-btn").addEventListener("click", onRetry);
}

function updateHeaderFromTelegramUser(telegramUser) {
  const usernameEl = document.getElementById("header-username");
  const avatarEl = document.getElementById("header-avatar");
  usernameEl.textContent = telegramUser.username ? `@${telegramUser.username}` : telegramUser.displayName;
  if (telegramUser.profilePhoto) {
    avatarEl.src = telegramUser.profilePhoto;
  }
}

function wireHeaderProfileLink() {
  const headerUser = document.getElementById("header-user");
  headerUser.style.cursor = "pointer";
  headerUser.addEventListener("click", () => navigateTo("profile"));
}

/**
 * Wires the hidden admin activation gesture on the header logo: five
 * quick taps, then a press-and-hold of roughly 2–3 seconds on the sixth
 * interaction opens the admin login popup.
 */
function wireAdminGesture() {
  const target = document.getElementById("admin-tap-target");
  let tapCount = 0;
  let resetTimer = null;
  let holdTimer = null;
  let pressStart = 0;

  function scheduleReset() {
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      tapCount = 0;
    }, 4000);
  }

  target.addEventListener("pointerdown", () => {
    pressStart = Date.now();
    if (tapCount === 5) {
      holdTimer = setTimeout(async () => {
        tapCount = 0;
        clearTimeout(resetTimer);
        hapticImpact("heavy");
        const { openAdminLoginModal } = await import("./pages/admin.js");
        openAdminLoginModal();
      }, 2200);
    }
  });

  target.addEventListener("pointerup", () => {
    const heldMs = Date.now() - pressStart;
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
      tapCount = 0;
      clearTimeout(resetTimer);
      return;
    }
    if (heldMs < 500) {
      tapCount += 1;
      scheduleReset();
    } else {
      tapCount = 0;
    }
  });

  target.addEventListener("pointercancel", () => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
    tapCount = 0;
  });
}

function waitForFirstValue(subscribeFn, stateKey) {
  return new Promise((resolve) => {
    let resolved = false;
    subscribeFn((value) => {
      appState.set(stateKey, value);
      if (!resolved) {
        resolved = true;
        resolve(value);
      }
    });
  });
}

async function boot() {
  setSplashStatus("Starting up…");

  if (!isInsideTelegram()) {
    showOutsideTelegramScreen();
    return;
  }

  initTelegram();

  setSplashStatus("Signing in…");
  let telegramUser, appUser;
  try {
    const result = await bootstrapTelegramAuth();
    telegramUser = result.telegramUser;
    appUser = result.appUser;
  } catch (err) {
    const message = err instanceof AuthError ? err.message : "Something went wrong while starting up.";
    showSplashError(message, () => window.location.reload());
    return;
  }

  appState.set("telegramUser", telegramUser);
  appState.set("appUser", appUser);

  setSplashStatus("Loading settings…");
  try {
    await waitForFirstValue((cb) => subscribeSettings(cb), "settings");
  } catch (err) {
    showSplashError("Couldn't load app settings. Please check your connection.", () => window.location.reload());
    return;
  }

 subscribeUser(
    appUser.firebaseUid,

  setSplashStatus("Loading home…");
  updateHeaderFromTelegramUser(telegramUser);
  wireHeaderProfileLink();
  wireAdminGesture();

  initGlobalUI();
  initNetworkMonitor();

  initRouter({
    pageOutlet: document.getElementById("page-outlet"),
    bottomNav: document.getElementById("bottom-nav"),
    pages: PAGE_REGISTRY,
    defaultPage: "home",
  });

  attachPullToRefresh(document.getElementById("page-outlet"), () => refreshCurrentPage());

  // Reveal the app and dismiss the splash screen.
  appEl.classList.remove("hidden");
  splashEl.classList.add("is-leaving");
  setTimeout(() => splashEl.remove(), 500);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

boot();
