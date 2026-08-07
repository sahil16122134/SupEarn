/* ==========================================================================
   SupEarn — js/core/auth.js
   Telegram → Firebase Authentication → Firestore user bootstrap.
   Also handles the separate hidden-admin email/password login flow.
   ========================================================================== */

import {
  signInAnonymously,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { auth } from "./firebase-config.js";
import { getOrCreateUser, recordReferralIfNew, isUserAdmin } from "./firestore.js";
import { getTelegramUser, getReferrerIdFromStartParam } from "./telegram.js";

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
 * Full startup bootstrap: ensures a Firebase Auth session exists (creating
 * an anonymous one if needed), reads the Telegram profile, and syncs the
 * corresponding Firestore user document — creating it on first login.
 * Returns { telegramUser, appUser }.
 */
export async function bootstrapTelegramAuth() {
  const telegramUser = getTelegramUser();
  if (!telegramUser) {
    throw new AuthError("NO_TELEGRAM_USER", "Could not read your Telegram profile.");
  }

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

  let appUser;
  try {
    appUser = await getOrCreateUser(telegramUser, firebaseUser.uid);
  } catch (err) {
    if (err && err.code === "permission-denied") {
      throw new AuthError(
        "ACCOUNT_MISMATCH",
        "This SupEarn account is linked to a different device session."
      );
    }
    throw new AuthError("FIRESTORE_BOOTSTRAP_FAILED", "Could not load your account.");
  }

  // Only ever attempts to record a referral once, the first time this
  // Telegram ID is ever seen — recordReferralIfNew() itself is a no-op if
  // a referral record already exists for this user.
  const referrerId = getReferrerIdFromStartParam();
  if (referrerId) {
    try {
      await recordReferralIfNew(telegramUser.telegramId, referrerId);
    } catch (err) {
      // Referral tracking is non-critical to login — never block startup.
    }
  }

  return { telegramUser, appUser };
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
