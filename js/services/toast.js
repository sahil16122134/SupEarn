/* ==========================================================================
   SupEarn — js/services/toast.js
   Animated toast notifications. Rendered into the fixed #toast-outlet
   defined in index.html. Auto-dismisses; tap to dismiss early.
   ========================================================================== */

const ICONS = {
  success: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" fill="currentColor"/></svg>',
  error: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/></svg>',
  warning: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/></svg>',
  info: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M11 7h2v2h-2V7zm0 4h2v6h-2v-6zm1-9a10 10 0 100 20 10 10 0 000-20z" fill="currentColor"/></svg>',
};

const COLORS = {
  success: { bg: "rgba(52, 211, 153, 0.14)", border: "rgba(52, 211, 153, 0.35)", fg: "#34d399" },
  error: { bg: "rgba(248, 113, 113, 0.14)", border: "rgba(248, 113, 113, 0.35)", fg: "#f87171" },
  warning: { bg: "rgba(251, 191, 36, 0.14)", border: "rgba(251, 191, 36, 0.35)", fg: "#fbbf24" },
  info: { bg: "rgba(96, 165, 250, 0.14)", border: "rgba(96, 165, 250, 0.35)", fg: "#60a5fa" },
};

let outlet = null;

function getOutlet() {
  if (!outlet) {
    outlet = document.getElementById("toast-outlet");
  }
  return outlet;
}

/**
 * Shows a toast. type: "success" | "error" | "warning" | "info".
 * Returns a dismiss() function in case the caller wants to close it early.
 */
export function showToast(message, type = "info", duration = 3200) {
  const container = getOutlet();
  if (!container) return () => {};

  const colors = COLORS[type] || COLORS.info;
  const icon = ICONS[type] || ICONS.info;

  const toastEl = document.createElement("div");
  toastEl.className = "toast-item anim-slide-up-in";
  toastEl.setAttribute("role", "status");
  toastEl.style.cssText = `
    display:flex; align-items:center; gap:10px;
    background:${colors.bg}; border:1px solid ${colors.border}; color:${colors.fg};
    backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    padding:12px 14px; border-radius:16px; font-size:0.85rem; font-weight:500;
    box-shadow:0 8px 24px rgba(0,0,0,0.35); pointer-events:auto; cursor:pointer;
  `;
  toastEl.innerHTML = `
    <span style="flex-shrink:0; display:flex;">${icon}</span>
    <span style="flex:1; color:#f1f5f9;">${escapeHtml(message)}</span>
  `;

  container.appendChild(toastEl);

  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    toastEl.classList.remove("anim-slide-up-in");
    toastEl.classList.add("anim-fade-out");
    setTimeout(() => toastEl.remove(), 250);
  };

  toastEl.addEventListener("click", dismiss);
  const timer = setTimeout(dismiss, duration);
  toastEl.addEventListener("click", () => clearTimeout(timer));

  return dismiss;
}

export function toastSuccess(message, duration) {
  return showToast(message, "success", duration);
}

export function toastError(message, duration) {
  return showToast(message, "error", duration);
}

export function toastWarning(message, duration) {
  return showToast(message, "warning", duration);
}

export function toastInfo(message, duration) {
  return showToast(message, "info", duration);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
