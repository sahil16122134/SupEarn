/* ==========================================================================
   SupEarn — js/services/adeasly.js
   Adeasly offerwall integration. Adeasly tracks task completion on its own
   servers (the user is sent to the offer with a tracked click ID and
   Adeasly's API reports back whether it was completed), so this wrapper's
   job is: fetch the current task list for this user, open a task when
   tapped, and re-fetch to detect the start → completed transition.
   ========================================================================== */

const ADEASLY_API_BASE = "https://api.adeasly.io/v1";

/**
 * Fetches this user's current Adeasly task list. Each returned task is
 * normalized into SupEarn's shared task-card shape. Returns an empty
 * array (rather than throwing) if Adeasly isn't configured or the request
 * fails, so a provider outage never breaks the rest of the Tasks screen.
 */
export async function fetchAdeaslyTasks(apiKey, telegramId) {
  if (!apiKey) return [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      `${ADEASLY_API_BASE}/tasks?api_key=${encodeURIComponent(apiKey)}&user_id=${encodeURIComponent(telegramId)}`,
      { method: "GET", signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!response.ok) return [];

    const payload = await response.json();
    const rawTasks = Array.isArray(payload.tasks) ? payload.tasks : [];

    return rawTasks.map((t) => normalizeAdeaslyTask(t));
  } catch (err) {
    return [];
  }
}

function normalizeAdeaslyTask(t) {
  return {
    id: `adeasly_${t.id}`,
    providerTaskId: t.id,
    provider: "Adeasly",
    title: t.title || "Adeasly Task",
    description: t.description || "",
    reward: Number(t.reward_coins || t.reward || 0),
    estimatedTime: t.estimated_time || "",
    iconUrl: t.icon_url || "",
    iconLetter: (t.title || "A").charAt(0).toUpperCase(),
    status: mapAdeaslyStatus(t.status),
    clickUrl: t.click_url || t.url || "",
  };
}

function mapAdeaslyStatus(rawStatus) {
  switch (rawStatus) {
    case "completed":
    case "approved":
      return "claim"; // provider confirms completion; coins are credited on tap
    case "in_progress":
    case "started":
      return "continue";
    case "rejected":
    case "expired":
      return "disabled";
    default:
      return "start";
  }
}

/**
 * Returns the Adeasly task's tracked click URL. The caller opens it via
 * telegram.js's openExternalLink() so it launches in Telegram's in-app
 * browser rather than navigating away from the Mini App.
 */
export function getAdeaslyClickUrl(task) {
  return task.clickUrl;
}
