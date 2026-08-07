/* ==========================================================================
   SupEarn — js/core/firestore.js
   Central Firestore data-access layer. User documents are keyed by
   firebaseUid (from Firebase Anonymous Auth) rather than telegramId —
   telegramId is kept only as stored data on the document and wherever
   the referral system (which is telegramId-based end-to-end) needs it.
   Settings, redeem requests, and referrals all read/write exclusively
   through these functions.
   ========================================================================== */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
  increment,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { db } from "./firebase-config.js";

/* ============================================================ */
/* SETTINGS                                                       */
/* ============================================================ */

const SETTINGS_DOC = doc(db, "settings", "economy");
/** Hard-coded fallback used only if the settings document cannot be read
 *  (e.g. very first deployment before an admin has configured it, or a
 *  transient offline state during startup). The live app always prefers
 *  Firestore's values the moment they load. */
const DEFAULT_SETTINGS = {
  watchRewardCoins: 10,
  dailyRewardCoins: [10, 15, 20, 25, 30, 40, 60],
  coinsPerRupee: 100,
  minimumUpiRedeem: 1500,
  giftCardMinimums: { amazon: 2000, flipkart: 2000, myntra: 2500 },
  bannerAdId: "",
  rewardedAdId: "",
  watchCooldownSeconds: 15,
  popupCloseSeconds: 5,
  referralBonusCoins: 200,
  referralTasksRequired: 4,
  adsgramBlockId: "",
  adeaslyApiKey: "",
};

export function subscribeSettings(callback) {
  return onSnapshot(
    SETTINGS_DOC,
    (snap) => {
      callback(snap.exists() ? { ...DEFAULT_SETTINGS, ...snap.data() } : DEFAULT_SETTINGS);
    },
    () => callback(DEFAULT_SETTINGS)
  );
}

export async function getSettingsOnce() {
  try {
    const snap = await getDoc(SETTINGS_DOC);
    return snap.exists() ? { ...DEFAULT_SETTINGS, ...snap.data() } : DEFAULT_SETTINGS;
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettings(partialSettings) {
  await setDoc(SETTINGS_DOC, { ...partialSettings, updatedAt: serverTimestamp() }, { merge: true });
}

/* ============================================================ */
/* USERS — keyed by firebaseUid                                   */
/* ============================================================ */

function userRef(firebaseUid) {
  return doc(db, "users", String(firebaseUid));
}

/**
 * Reads the user document at users/{firebaseUid} if it exists, or creates
 * it on first login using the Telegram profile. The `firebaseUid` field
 * is stored on the document itself (in addition to being the document
 * ID) purely for convenience in queries; `telegramId` is stored as plain
 * data — it is never used as a Firestore document ID.
 */
export async function getOrCreateUser(telegramUser, firebaseUid) {

    if (!firebaseUid) {
        throw new Error("INVALID_FIREBASE_UID");
    }

    const ref = userRef(firebaseUid);

    return runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);

    if (snap.exists()) {
      const data = snap.data();
      // Keep profile fields fresh in case the user changed their Telegram
      // username/photo/name since their last visit.
      const freshFields = {
        telegramId: telegramUser.telegramId,
        username: telegramUser.username,
        displayName: telegramUser.displayName,
        firstName: telegramUser.firstName,
        lastName: telegramUser.lastName,
        profilePhoto: telegramUser.profilePhoto,
        languageCode: telegramUser.languageCode,
        updatedAt: new Date(),
      };
      tx.update(ref, freshFields);
      return { id: ref.id, ...data, ...freshFields };
    }

    const newUser = {
      firebaseUid,
      telegramId: telegramUser.telegramId,
      username: telegramUser.username,
      displayName: telegramUser.displayName,
      firstName: telegramUser.firstName,
      lastName: telegramUser.lastName,
      profilePhoto: telegramUser.profilePhoto,
      languageCode: telegramUser.languageCode,
      role: "user",
      coinBalance: 0,
      totalEarnedCoins: 0,
      totalRedeemedCoins: 0,
      lastDailyLogin: null,
      dailyStreak: 0,
      lastRewardedAdTime: null,
      pendingRedeemId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    tx.set(ref, newUser);
  return {
    id: ref.id,
    ...newUser,
    createdAt: new Date(),
    updatedAt: new Date()
};
  });
}

export function subscribeUser(firebaseUid, callback, onError) {
  return onSnapshot(
    userRef(firebaseUid),
    (snap) => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null),
(err) => {
    console.error("subscribeUser:", err);
    if (onError) onError(err);

}

export async function getUserOnce(firebaseUid) {
  const snap = await getDoc(userRef(firebaseUid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Atomically credits coins to a user's wallet (used after a verified
 * rewarded-ad completion). Returns the resulting balance.
 */
export async function creditCoins(firebaseUid, amount) {
  const ref = userRef(firebaseUid);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("USER_NOT_FOUND");
    const current = snap.data().coinBalance || 0;
    const newBalance = current + amount;
    tx.update(ref, {
      coinBalance: increment(amount),
      totalEarnedCoins: increment(amount),
      updatedAt: serverTimestamp(),
    });
    return newBalance;
  });
}

export async function setWatchAdCooldown(firebaseUid) {
  await updateDoc(userRef(firebaseUid), {
    lastRewardedAdTime: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Atomically verifies the watch-ad cooldown has elapsed and credits the
 * reward in a single transaction — combining what would otherwise be a
 * separate check-then-credit-then-set-cooldown sequence, which a modified
 * client could race or skip entirely. Throws COOLDOWN_ACTIVE if a watch
 * is attempted before the configured cooldown has passed.
 */
export async function creditWatchAdRewardTx(firebaseUid, rewardAmount, cooldownSeconds) {
  const ref = userRef(firebaseUid);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("USER_NOT_FOUND");
    const data = snap.data();

    const lastAdTime = data.lastRewardedAdTime;
    if (lastAdTime && typeof lastAdTime.toDate === "function") {
      const elapsedMs = Date.now() - lastAdTime.toDate().getTime();
      if (elapsedMs < cooldownSeconds * 1000) {
        throw new Error("COOLDOWN_ACTIVE");
      }
    }

    tx.update(ref, {
      coinBalance: increment(rewardAmount),
      totalEarnedCoins: increment(rewardAmount),
      lastRewardedAdTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return (data.coinBalance || 0) + rewardAmount;
  });
}

/**
 * Claims the daily login reward atomically: verifies the user hasn't
 * already claimed today, computes the new streak (resetting if a day was
 * missed), and credits the reward — all inside one transaction so a
 * double-tap or race condition can never grant two rewards.
 */
export async function claimDailyLoginTx(firebaseUid, todayKey, yesterdayKey, rewardForDay) {
  const ref = userRef(firebaseUid);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("USER_NOT_FOUND");
    const data = snap.data();

    if (data.lastDailyLogin === todayKey) {
      throw new Error("ALREADY_CLAIMED_TODAY");
    }

    const continuingStreak = data.lastDailyLogin === yesterdayKey;
    const currentStreak = continuingStreak ? data.dailyStreak || 0 : 0;
    const newStreakDay = (currentStreak % 7) + 1;
    const reward = rewardForDay(newStreakDay);

    tx.update(ref, {
      lastDailyLogin: todayKey,
      dailyStreak: newStreakDay,
      coinBalance: increment(reward),
      totalEarnedCoins: increment(reward),
      updatedAt: serverTimestamp(),
    });

    return { newStreakDay, reward };
  });
}

/* ============================================================ */
/* REDEEM REQUESTS                                                */
/* ============================================================ */

const redeemCol = collection(db, "redeemRequests");

/**
 * Creates a redeem request and debits the wallet atomically. Guards
 * against a second pending request or insufficient balance by re-checking
 * both inside the same transaction that performs the debit. The request
 * document stores both firebaseUid (used for the balance update / admin
 * resolve) and telegramId (so the admin panel can still display it).
 */
export async function createRedeemRequestTx(firebaseUid, telegramId, requestPayload, amountCoins) {
  const userDocRef = userRef(firebaseUid);
  const newRequestRef = doc(redeemCol);

  return runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userDocRef);
    if (!userSnap.exists()) throw new Error("USER_NOT_FOUND");
    const userData = userSnap.data();

    if (userData.pendingRedeemId) {
      throw new Error("PENDING_REQUEST_EXISTS");
    }
    if ((userData.coinBalance || 0) < amountCoins) {
      throw new Error("INSUFFICIENT_BALANCE");
    }

    tx.set(newRequestRef, {
      ...requestPayload,
      firebaseUid: String(firebaseUid),
      telegramId: String(telegramId),
      amount: amountCoins,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    tx.update(userDocRef, {
      coinBalance: increment(-amountCoins),
      totalRedeemedCoins: increment(amountCoins),
      pendingRedeemId: newRequestRef.id,
      updatedAt: serverTimestamp(),
    });

    return newRequestRef.id;
  });
}

export function subscribeAllPendingRedeemRequests(callback, onError) {
  const q = query(redeemCol, where("status", "==", "pending"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => onError && onError(err)
  );
}

/**
 * Admin approves or rejects a request: deletes the request document and
 * clears the requester's pendingRedeemId in one transaction. Rejection
 * additionally refunds the debited coins. Balance updates go through the
 * requester's firebaseUid — the request document's stored telegramId is
 * for admin display only, never used to locate the user document.
 */
export async function resolveRedeemRequestTx(requestId, firebaseUid, approve, refundAmount) {
  const requestRef = doc(db, "redeemRequests", requestId);
  const userDocRef = userRef(firebaseUid);

  return runTransaction(db, async (tx) => {
    const reqSnap = await tx.get(requestRef);
    if (!reqSnap.exists()) throw new Error("REQUEST_NOT_FOUND");

    tx.delete(requestRef);

    const userUpdate = {
      pendingRedeemId: null,
      updatedAt: serverTimestamp(),
    };
    if (!approve && refundAmount) {
      userUpdate.coinBalance = increment(refundAmount);
      userUpdate.totalRedeemedCoins = increment(-refundAmount);
    }
    tx.update(userDocRef, userUpdate);
  });
}

/* ============================================================ */
/* REFERRALS — unchanged, still keyed and identified by telegramId */
/* ============================================================ */

function referralRef(telegramId) {
  return doc(db, "referrals", String(telegramId));
}

/**
 * Records the referrer for a brand-new user. No-ops if a referral record
 * already exists (a user can only ever be referred once). Referral links
 * and IDs remain telegramId-based — referrerId is always a telegramId —
 * but firebaseUid (the *referred* user's) is stored too because the
 * security rules require request.resource.data.firebaseUid ==
 * request.auth.uid on both create and update of this document.
 */
export async function recordReferralIfNew(telegramId, referrerId, firebaseUid) {
  if (!referrerId || String(referrerId) === String(telegramId)) return;
  const ref = referralRef(telegramId);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    telegramId: String(telegramId),
    referrerId: String(referrerId),
    firebaseUid: String(firebaseUid),
    tasksCompleted: 0,
    bonusPaid: false,
    createdAt: serverTimestamp(),
  });
}

export async function getReferralOnce(telegramId) {
  const snap = await getDoc(referralRef(telegramId));
  return snap.exists() ? snap.data() : null;
}

/**
 * Increments the referred user's completed-task count, and — once it
 * reaches the configured threshold — marks the referral bonusPaid so it
 * can never be paid twice. This only ever touches the referred user's
 * OWN referral document (referrals/{telegramId}, guarded by
 * firebaseUid == request.auth.uid in the security rules), which is all
 * a signed-in client is allowed to write.
 *
 * IMPORTANT: this function does NOT credit the referrer's wallet. Under
 * the current security rules, a client can only ever update its own
 * users/{firebaseUid} document — there is no rule-safe way for User A's
 * client to credit User B's balance. The actual coin payout happens
 * server-side, in a Cloud Function that watches for bonusPaid flipping
 * to true on a referrals document and credits the referrer's wallet
 * using the Admin SDK (which bypasses Security Rules). See
 * functions/index.js — onReferralBonusPaid.
 */
export async function incrementReferralTaskProgressTx(telegramId, tasksRequired) {
  const refDoc = referralRef(telegramId);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(refDoc);
    if (!snap.exists()) return null;
    const data = snap.data();
    if (data.bonusPaid) return data;

    const newCount = (data.tasksCompleted || 0) + 1;
    const shouldPayBonus = newCount >= tasksRequired;

    tx.update(refDoc, {
      tasksCompleted: newCount,
      bonusPaid: shouldPayBonus ? true : false,
    });

    return { ...data, tasksCompleted: newCount, bonusPaid: shouldPayBonus };
  });
}

/* ============================================================ */
/* TASK COMPLETIONS (offerwall providers: AdsGram, Adeasly)       */
/* ============================================================ */

function taskCompletionRef(firebaseUid, taskId) {
  return doc(db, "taskCompletions", `${firebaseUid}_${taskId}`);
}

/**
 * Returns true if this task has already been rewarded for this user, so
 * providers that re-report a completed task on every poll can never pay
 * out twice.
 */
export async function isTaskAlreadyRewarded(firebaseUid, taskId) {
  const snap = await getDoc(taskCompletionRef(firebaseUid, taskId));
  return snap.exists();
}

/**
 * Atomically records a task as rewarded and credits the coins in one
 * transaction. Throws ALREADY_REWARDED if a concurrent call already
 * claimed it, so callers can safely fire this from a polling loop. The
 * completion document stores both firebaseUid (the lookup key) and
 * telegramId (plain data, for admin/debug visibility).
 */
export async function creditTaskRewardOnceTx(firebaseUid, telegramId, taskId, amount, provider) {
  const completionRef = taskCompletionRef(firebaseUid, taskId);
  const userDocRef = userRef(firebaseUid);

  return runTransaction(db, async (tx) => {
    const completionSnap = await tx.get(completionRef);
    if (completionSnap.exists()) {
      throw new Error("ALREADY_REWARDED");
    }
    const userSnap = await tx.get(userDocRef);
    if (!userSnap.exists()) throw new Error("USER_NOT_FOUND");

    tx.set(completionRef, {
      firebaseUid: String(firebaseUid),
      telegramId: String(telegramId),
      taskId,
      provider,
      amount,
      rewardedAt: serverTimestamp(),
    });
    tx.update(userDocRef, {
      coinBalance: increment(amount),
      totalEarnedCoins: increment(amount),
      updatedAt: serverTimestamp(),
    });
  });
}

/* ============================================================ */
/* ADMIN                                                          */
/* ============================================================ */

/**
 * Admin accounts authenticate via Firebase email/password, so
 * auth.currentUser.uid *is* the document ID at users/{uid} — no query
 * needed, just a direct read.
 */
export async function isUserAdmin(firebaseUid) {
  const snap = await getDoc(userRef(firebaseUid));
  return snap.exists() && snap.data().role === "admin";
}
