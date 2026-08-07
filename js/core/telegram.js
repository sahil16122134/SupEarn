/* ==========================================================================
   SupEarn — js/core/telegram.js
   Telegram Mini App SDK wrapper. Every other module talks to Telegram
   exclusively through this file — nothing else touches window.Telegram.
   ========================================================================== */

/**
 * Replace with your actual published bot username (without the @).
 * Used to build the "Open Telegram Bot" deep link and referral links.
 */
export const TELEGRAM_BOT_USERNAME = "SupEarnBot";

let webApp = null;
let backButtonHandler = null;

/**
 * Returns true if the app is currently running inside the Telegram client
 * (i.e. the Telegram WebApp bridge is present and initData was supplied).
 */
export function isInsideTelegram() {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (!tg) return false;
  // A real Telegram launch always provides a non-empty initData string.
  // Bare visits to the URL in a normal browser will have an empty string.
  return typeof tg.initData === "string" && tg.initData.length > 0;
}

/**
 * Initializes the Telegram WebApp bridge: signals readiness, expands to
 * full height, applies the app's fixed dark theme to native chrome, and
 * configures native behaviors (swipe-to-close confirmation, back button).
 */
export function initTelegram() {
  if (!isInsideTelegram()) {
    return false;
  }

  webApp = window.Telegram.WebApp;

  webApp.ready();
  webApp.expand();

  // Match native Telegram chrome (header/background) to our fixed dark
  // glass theme so there's no visual seam between OS chrome and the app.
  try {
    webApp.setHeaderColor("#0a0f2c");
    webApp.setBackgroundColor("#060a1f");
  } catch (err) {
    // Older Telegram clients may not support these calls — safe to ignore.
  }

  // Prevent accidental swipe-down closing the app mid-task.
  if (typeof webApp.enableClosingConfirmation === "function") {
    webApp.enableClosingConfirmation();
  }
  if (typeof webApp.disableVerticalSwipes === "function") {
    webApp.disableVerticalSwipes();
  }

  return true;
}

/**
 * Returns the raw initData string, required for verifying the Telegram
 * identity signature (hash + auth_date) before trusting any user claim.
 */
export function getInitData() {
  return webApp ? webApp.initData : "";
}

/**
 * Extracts and normalizes the Telegram user profile from initDataUnsafe.
 * Returns null if unavailable (should never happen once isInsideTelegram()
 * has been confirmed true, but guarded defensively).
 */
export function getTelegramUser() {
  if (!webApp || !webApp.initDataUnsafe || !webApp.initDataUnsafe.user) {
    return null;
  }

  const u = webApp.initDataUnsafe.user;
  const firstName = u.first_name || "";
  const lastName = u.last_name || "";
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || u.username || `User ${u.id}`;

  return {
    telegramId: String(u.id),
    username: u.username || "",
    firstName,
    lastName,
    displayName,
    profilePhoto: u.photo_url || "",
    languageCode: u.language_code || "en",
    isPremium: Boolean(u.is_premium),
  };
}

/**
 * Returns the referrer's Telegram ID from a deep-link start_param, e.g.
 * https://t.me/SupEarnBot?start=123456789 → "123456789".
 * Returns null if the app was opened without a referral start param.
 */
export function getReferrerIdFromStartParam() {
  if (!webApp || !webApp.initDataUnsafe) return null;
  const startParam = webApp.initDataUnsafe.start_param;
  if (!startParam) return null;
  // start_param must be alphanumeric/underscore per Telegram's spec.
  if (!/^[a-zA-Z0-9_]+$/.test(startParam)) return null;
  return startParam;
}

/**
 * Builds this user's shareable referral deep link.
 */
export function buildReferralLink(telegramId) {
  return `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${encodeURIComponent(telegramId)}`;
}

/**
 * Opens the bot chat in Telegram (used by the outside-Telegram screen and
 * anywhere we need to hand the user back to the bot itself).
 */
export function openTelegramBotLink() {
  const url = `https://t.me/${TELEGRAM_BOT_USERNAME}`;
  if (webApp && typeof webApp.openTelegramLink === "function") {
    webApp.openTelegramLink(url);
  } else {
    window.open(url, "_blank", "noopener");
  }
}

/**
 * Opens Telegram's native share sheet pre-filled with the referral link.
 */
export function shareReferralLink(link, text) {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
  if (webApp && typeof webApp.openTelegramLink === "function") {
    webApp.openTelegramLink(shareUrl);
  } else {
    window.open(shareUrl, "_blank", "noopener");
  }
}

/**
 * Opens any external http(s) link safely, using Telegram's in-app browser
 * bridge when available.
 */
export function openExternalLink(url) {
  if (webApp && typeof webApp.openLink === "function") {
    webApp.openLink(url);
  } else {
    window.open(url, "_blank", "noopener");
  }
}

/* ============================================================ */
/* HAPTICS                                                        */
/* ============================================================ */

export function hapticImpact(style = "medium") {
  if (webApp && webApp.HapticFeedback) {
    webApp.HapticFeedback.impactOccurred(style);
  }
}

export function hapticNotification(type = "success") {
  if (webApp && webApp.HapticFeedback) {
    webApp.HapticFeedback.notificationOccurred(type);
  }
}

export function hapticSelection() {
  if (webApp && webApp.HapticFeedback) {
    webApp.HapticFeedback.selectionChanged();
  }
}

/* ============================================================ */
/* BACK BUTTON                                                    */
/* ============================================================ */

/**
 * Shows the native Telegram back button and routes taps to the given
 * handler. Call showBackButton(null) to hide it again.
 */
export function showBackButton(handler) {
  if (!webApp || !webApp.BackButton) return;

  if (backButtonHandler) {
    webApp.BackButton.offClick(backButtonHandler);
    backButtonHandler = null;
  }

  if (typeof handler === "function") {
    backButtonHandler = handler;
    webApp.BackButton.onClick(backButtonHandler);
    webApp.BackButton.show();
  } else {
    webApp.BackButton.hide();
  }
}

/* ============================================================ */
/* NATIVE POPUPS                                                  */
/* ============================================================ */

/**
 * Shows Telegram's native confirm dialog. Falls back to window.confirm
 * outside Telegram (e.g. during local development).
 * Returns a Promise<boolean>.
 */
export function nativeConfirm(message) {
  return new Promise((resolve) => {
    if (webApp && typeof webApp.showConfirm === "function") {
      webApp.showConfirm(message, (confirmed) => resolve(Boolean(confirmed)));
    } else {
      resolve(window.confirm(message));
    }
  });
}

/**
 * Reads clipboard-writable text onto the system clipboard via the
 * standard Clipboard API (Telegram does not expose its own).
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older WebViews without Clipboard API support.
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    try {
      document.execCommand("copy");
      document.body.removeChild(el);
      return true;
    } catch (fallbackErr) {
      document.body.removeChild(el);
      return false;
    }
  }
}

/**
 * Closes the Mini App entirely.
 */
export function closeApp() {
  if (webApp && typeof webApp.close === "function") {
    webApp.close();
  }
}

/**
 * Returns the raw WebApp instance for rare cases that need direct access
 * (e.g. main.js reading colorScheme at startup). Prefer the helpers above.
 */
export function getWebApp() {
  return webApp;
}
