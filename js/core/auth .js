/* ==========================================================================
   SupEarn — js/core/auth.js
   Telegram → Firebase Anonymous Authentication → Firestore user bootstrap.
   Telegram remains the only login the user ever sees; Firebase Anonymous
   Auth runs silently in the background and its UID becomes the permanent
   key for this user's Firestore document (users/{firebaseUid}).
   Also handles the separate hidden-admin email/password login flow.
   ========================================================================== */

import {
  signInAnonymously,
  signInWithEmailAndPassword,
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

/**
 * Full startup bootstrap:
 *   1. Reads the Telegram profile (this is the only login UI the user
 *      ever sees — nothing Firebase-related is ever shown to them).
 *   2. Silently ensures a Firebase Anonymous Auth session exists,
 *      creating one via signInAnonymously() if needed.
 *   3. Uses auth.currentUser.uid as the permanent firebaseUid that keys
 *      this user's Firestore document (users/{firebaseUid}), creating it
 *      on first login from the Telegram profile.
 *
 * Returns { telegramUser, appUser, firebaseUid }.
 */
export async function bootstrapTelegramAuth() {
  const telegramUser = getTelegramUser();
  if (!telegramUser) {
    throw new AuthError("NO_TELEGRAM_USER", "Could not read your Telegram profile.");
  }

 let firebaseUser;

try {
    if (auth.currentUser) {
        firebaseUser = auth.currentUser;
    } else {
        const cred = await signInAnonymously(auth);
        firebaseUser = cred.user;
    }
} catch (err) {
    console.error("Anonymous auth failed:", err);
    throw new AuthError(
        "FIREBASE_AUTH_FAILED",
        "Could not connect to SupEarn's servers."
    );
}
  const firebaseUid = firebaseUser.uid;

  let appUser;
  try {
  appUser = await getOrCreateUser(telegramUser, firebaseUid);

console.log("Firestore User:", appUser);
  } catch (err) {
    console.error(err);
throw new AuthError(
    "FIRESTORE_BOOTSTRAP_FAILED",
    "Could not load your account."
);
    
  }

  // Only ever attempts to record a referral once, the first time this
  // Telegram ID is ever seen — recordReferralIfNew() itself is a no-op if
  // a referral record already exists for this user. Referrals are still
  // tracked entirely by telegramId, unrelated to firebaseUid.
  const referrerId = getReferrerIdFromStartParam();
  if (referrerId) {
    try {
      await recordReferralIfNew(telegramUser.telegramId, referrerId, firebaseUid);
    } catch (err) {
      // Referral tracking is non-critical to login — never block startup.
    }
  }

  return { telegramUser, appUser, firebaseUid };
}

/* ============================================================ */
/* ADMIN AUTH                                                     */
/* ============================================================ */

/**
 * Signs in with email/password and verifies the resulting account has
 * role:"admin" in Firestore at users/{uid}. Signs the account back out
 * and throws if not.
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
