/* ==========================================================================
   SupEarn — js/core/state.js
   Minimal reactive store. No framework — plain pub/sub keyed by field name.
   Pages and components subscribe to the keys they care about and re-render
   themselves when notified; nothing here touches the DOM directly.
   ========================================================================== */

class Store {
  constructor(initialState) {
    this._state = { ...initialState };
    this._listeners = new Map(); // key -> Set<callback>
  }

  get(key) {
    return this._state[key];
  }

  getAll() {
    return { ...this._state };
  }

  set(key, value) {
    this._state[key] = value;
    const subs = this._listeners.get(key);
    if (subs) {
      subs.forEach((cb) => {
        try {
          cb(value, this._state);
        } catch (err) {
          console.error(`[state] listener for "${key}" threw:`, err);
        }
      });
    }
  }

  /** Shallow-merges an object into an existing object-valued key, then
   *  notifies subscribers with the merged result (used for appUser/settings
   *  patches coming from Firestore snapshots). */
  patch(key, partial) {
    const merged = { ...(this._state[key] || {}), ...partial };
    this.set(key, merged);
  }

  subscribe(key, callback) {
    if (!this._listeners.has(key)) {
      this._listeners.set(key, new Set());
    }
    this._listeners.get(key).add(callback);
    return () => this._listeners.get(key).delete(callback);
  }
}

export const appState = new Store({
  telegramUser: null, // { telegramId, username, displayName, firstName, lastName, profilePhoto, languageCode }
  appUser: null, // live Firestore users/{firebaseUid} document
  settings: null, // live Firestore settings/app document
  isOnline: navigator.onLine,
  isAdmin: false,
  currentPage: "home",
  firebaseUid: null, // Firebase Anonymous Auth UID — the key for users/{firebaseUid}; set once by bootstrapTelegramAuth() at startup
});
export function getFirebaseUid() {
    return appState.get("firebaseUid");
}
export function getCurrentUser() {
    return appState.get("appUser");
}
export function getTelegramUser() {
    return appState.get("telegramUser");
}
/* ============================================================ */
/* DERIVED HELPERS                                                */
/* ============================================================ */

/** Converts a coin amount to a rupee display value using the current
 *  settings' coinPerRupee ratio. Falls back gracefully if settings
 *  haven't loaded yet. */
export function coinsToRupees(coins) {
  const settings = appState.get("settings");
  const ratio = (settings && settings.coinPerRupee) || 100;
  return coins / ratio;
}

export function formatRupees(coins) {
  const value = coinsToRupees(coins);
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatCoins(coins) {
  return Number(coins || 0).toLocaleString("en-IN");
}

/** Returns how far the user's balance is toward the minimum UPI redeem
 *  threshold, as a 0–100 percentage clamped for progress-bar display. */
export function redeemProgressPercent() {
  const settings = appState.get("settings");
  const user = appState.get("appUser");
  if (!settings || !user) return 0;
  const min = settings.minimumUpiRedeem || 1;
  const pct = ((user.coinBalance || 0) / min) * 100;
  return Math.max(0, Math.min(100, pct));
}
