/* ==========================================================================
   SupEarn — js/components/empty-state.js
   Reusable empty-state blocks: a soft glass illustration, a short message,
   and an optional retry action. Used for "no tasks", "no redeem requests",
   "no rewards", "no internet", and generic "nothing found" states.
   ========================================================================== */

const ICONS = {
  tasks: '<path d="M9 11l2 2 4-4M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  redeem: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
  reward: '<circle cx="12" cy="8" r="5" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M8.5 12.5L6 22l6-3 6 3-2.5-9.5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/>',
  offline: '<path d="M1 9l2 2c4.9-4.9 12.1-4.9 17 0l2-2C15.9 2.9 8.1 2.9 1 9zm7.1 7.1l3.9 3.9 3.9-3.9a5.5 5.5 0 00-7.8 0zM5 13l2 2a8.5 8.5 0 0110 0l2-2a11.5 11.5 0 00-14 0z" fill="currentColor"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M20 20l-4.35-4.35" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  giftcard: '<rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M3 11h18M12 7v13" stroke="currentColor" stroke-width="1.6"/><path d="M8 7c-1.5 0-2.5-1-2.5-2.2S6.5 3 8 3c1.8 0 3 2 4 4-1 0-2.5.2-4 0zm8 0c1.5 0 2.5-1 2.5-2.2S17.5 3 16 3c-1.8 0-3 2-4 4 1 0 2.5.2 4 0z" stroke="currentColor" stroke-width="1.4" fill="none"/>',
};

/**
 * Renders an empty state into `container`.
 * type: "tasks" | "redeem" | "reward" | "offline" | "search" | "giftcard"
 * Wires the retry button automatically if retryLabel + onRetry are given.
 */
export function showEmptyState(container, { type = "search", title, message, retryLabel = null, onRetry = null }) {
  if (!container) return;

  const iconPath = ICONS[type] || ICONS.search;

  container.innerHTML = `
    <div class="glass-card anim-fade-in" style="display:flex; flex-direction:column; align-items:center; text-align:center; padding:40px 24px; gap:6px;">
      <div style="width:76px; height:76px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, rgba(34,211,238,0.12), rgba(59,130,246,0.12)); border:1px solid var(--glass-border); color:var(--accent-cyan); margin-bottom:12px;">
        <svg viewBox="0 0 24 24" width="34" height="34">${iconPath}</svg>
      </div>
      <h4 style="margin-bottom:2px;">${escapeHtml(title)}</h4>
      <p style="max-width:280px;">${escapeHtml(message)}</p>
      ${retryLabel ? `<button type="button" class="btn-glass btn-secondary btn-sm" data-empty-retry style="margin-top:14px;">${escapeHtml(retryLabel)}</button>` : ""}
    </div>
  `;

  if (retryLabel && typeof onRetry === "function") {
    const btn = container.querySelector("[data-empty-retry]");
    if (btn) btn.addEventListener("click", onRetry);
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}
