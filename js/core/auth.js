/* ==========================================================================
   SupEarn — js/core/auth.js
   Telegram/Web → Firebase Authentication → Firestore user bootstrap.
   Also handles the separate hidden-admin email/password login flow.

   NOTE: this file was not part of the uploaded batch, but main.js's
   contract (destructuring { telegramUser, appUser, firebaseUid } from
   bootstrapTelegramAuth()) and the web-fallback requirement both require
   changes here, so it's included as one of the existing files that needs
   updating.
   ========================================================================== */

import {
  signInAnonymously,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { auth } from "./firebase-config.js";
import { getOrCreateUser, recordReferralIfNew, isUserAdmin } from "./firestore.js";
import { getTelegramUser, getReferrerIdFromStartParam, isInsideTelegram } from "./telegram.js";

/** Thrown for any failure in the auth/bootstrap chain, carrying a stable
 *  `code` the UI layer can map to a friendly message. */
export class AuthError extends Error {
  constructor(code, message) {
    super(message || code);
    this.name = "AuthError";
    this.code = code;
  }
}

function waitForFirebaseUser() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      (err) => {
        unsubscribe();
        reject(err);
      }
    );
  });
}

/**
 * Builds a temporary guest identity for people opening the site directly
 * from the browser (e.g. GitHub Pages) instead of through Telegram. Shaped
 * identically to a real Telegram profile so every downstream function
 * (getOrCreateUser, the UI, etc.) can treat it the same way. Tied to the
 * Firebase anonymous UID, so it's stable for that browser session but
 * intentionally "temporary" — clearing site data starts a fresh guest.
 */
function buildTemporaryWebUser(firebaseUid) {
  return {
    telegramId: `web_${firebaseUid}`,
    username: "",
    firstName: "Guest",
    lastName: "",
    displayName: "Guest",
    profilePhoto: "",
    languageCode: (navigator.language || "en").slice(0, 2),
    isPremium: false,
    isWebGuest: true,
  };
}

/**
 * Full startup bootstrap: ensures a Firebase Auth session exists (creating
 * an anonymous one if needed), reads the Telegram profile when running
 * inside Telegram — or builds a temporary web-guest identity when not —
 * and syncs the corresponding Firestore user document at users/{firebaseUid},
 * creating it on first login. Returns { telegramUser, appUser, firebaseUid }.
 */
export async function bootstrapTelegramAuth() {
  let firebaseUser;
  try {
    firebaseUser = await waitForFirebaseUser();
    if (!firebaseUser) {
      const cred = await signInAnonymously(auth);
      firebaseUser = cred.user;
    }
  } catch (err) {
    throw new AuthError("FIREBASE_AUTH_FAILED", "Could not connect to SupEarn's servers.");
  }

  const firebaseUid = firebaseUser.uid;

  // Inside Telegram: use the real Telegram profile. Outside Telegram
  // (e.g. visiting the GitHub Pages site directly): fall back to a
  // temporary web-guest identity rather than blocking access.
  const telegramUser = isInsideTelegram() ? getTelegramUser() : null;
  const effectiveUser = telegramUser || buildTemporaryWebUser(firebaseUid);

  if (isInsideTelegram() && !telegramUser) {
    // We're inside the Telegram WebView but couldn't read the profile —
    // a real problem worth surfacing, rather than silently guest-ing them.
    throw new AuthError("NO_TELEGRAM_USER", "Could not read your Telegram profile.");
  }

  let appUser;
  try {
    appUser = await getOrCreateUser(effectiveUser, firebaseUid);
  } catch (err) {
    throw new AuthError("FIRESTORE_BOOTSTRAP_FAILED", "Could not load your account.");
  }

  // Referral recording only makes sense for real Telegram launches with a
  // start_param — never for temporary web guests. Never blocks startup.
  if (telegramUser) {
    const referrerId = getReferrerIdFromStartParam();
    if (referrerId) {
      try {
        await recordReferralIfNew(effectiveUser.telegramId, referrerId, firebaseUid);
      } catch (err) {
        // Non-critical — never block login on referral tracking.
      }
    }
  }

  return { telegramUser: effectiveUser, appUser, firebaseUid };
}

/* ============================================================ */
/* ADMIN AUTH                                                     */
/* ============================================================ */

/**
 * Signs in with email/password and verifies the resulting account has
 * role:"admin" in Firestore. Signs the account back out and throws if not.
 */
export async function signInAdmin(email, password) {
  let cred;
  try {
    cred = await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    throw new AuthError("ADMIN_LOGIN_FAILED", "Incorrect email or password.");
  }

  let admin = false;
  try {
    admin = await isUserAdmin(cred.user.uid);
  } catch (err) {
    admin = false;
  }

  if (!admin) {
    await signOut(auth);
    throw new AuthError("NOT_ADMIN", "This account does not have admin access.");
  }

  return cred.user;
}

export async function signOutAdmin() {
  await signOut(auth);
}
