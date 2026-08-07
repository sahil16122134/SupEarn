/* ==========================================================================
   SupEarn — js/core/utils.js
   Small stateless helpers shared across pages. Date-key logic lives here
   once so Home's streak subtitle and the Daily Login page never drift out
   of sync with each other.
   ========================================================================== */

/** Returns "YYYY-MM-DD" for the user's local today. */
export function getTodayKey() {
  return toDateKey(new Date());
}

/** Returns "YYYY-MM-DD" for the user's local yesterday. */
export function getYesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateKey(d);
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Given a user's lastDailyLogin key and current dailyStreak, returns the
 * day-of-cycle (1–7) that would be claimed *next* if they claim today —
 * used to preview "today's reward" before they've actually claimed it.
 */
export function getNextStreakDay(lastDailyLogin, dailyStreak) {
  const today = getTodayKey();
  const yesterday = getYesterdayKey();

  if (lastDailyLogin === today) {
    // Already claimed today — "next" is the day after in the cycle.
    return (dailyStreak % 7) + 1;
  }
  const continuing = lastDailyLogin === yesterday;
  const currentStreak = continuing ? dailyStreak || 0 : 0;
  return (currentStreak % 7) + 1;
}

export function hasClaimedToday(lastDailyLogin) {
  return lastDailyLogin === getTodayKey();
}

/** Formats a Firestore Timestamp-like value or Date into a short display string. */
export function formatDateShort(value) {
  if (!value) return "";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Simple client-side email format check. */
export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

/** Simple client-side UPI ID format check (name@bank). */
export function isValidUpiId(value) {
  return /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/.test(String(value || "").trim());
}
