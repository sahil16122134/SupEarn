/* ==========================================================================
   SupEarn — js/components/modal.js
   Generic glass popup renderer. Every popup in the app (reward popups,
   redeem confirmation, admin login, error dialogs) goes through here so
   backdrop behavior, animation, and auto-close countdown stay consistent.
   ========================================================================== */

let outlet = null;
let activeModal = null; // { backdropEl, autoCloseTimer, countdownInterval }

function getOutlet() {
  if (!outlet) outlet = document.getElementById("modal-outlet");
  return outlet;
}

/**
 * Opens a popup.
 *
 * options.bodyHtml        — inner HTML for the glass card content.
 * options.cardClassName    — extra class(es) for the glass card element.
 * options.dismissible      — whether tapping the backdrop / X closes it (default true).
 * options.showCloseButton  — show the top-right X button (default true).
 * options.autoCloseSeconds — if set, shows a countdown and auto-closes.
 * options.onClose          — called once, however the modal closes.
 * options.onMount          — called with the card element right after insertion,
 *                             so the caller can wire up its own button handlers.
 *
 * Returns a close() function the caller can invoke manually.
 */
export function openModal(options) {
  const container = getOutlet();
  if (!container) return () => {};

  closeModal(); // only one modal at a time

  const {
    bodyHtml = "",
    cardClassName = "",
    dismissible = true,
    showCloseButton = true,
    autoCloseSeconds = null,
    onClose = null,
    onMount = null,
  } = options;

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop anim-backdrop-in";
  backdrop.style.cssText = `
    position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
    background:rgba(6,10,31,0.55); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);
    padding:20px; pointer-events:auto; z-index:1;
  `;

  const card = document.createElement("div");
  card.className = `glass-card anim-pop-in ${cardClassName}`;
  card.style.cssText = "position:relative; max-width:400px; width:100%; max-height:88vh; overflow-y:auto;";
  card.innerHTML = bodyHtml;

  if (showCloseButton) {
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.className = "btn-icon";
    closeBtn.style.cssText = "position:absolute; top:12px; right:12px; z-index:2;";
    closeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M18.3 5.71L12 12.01l-6.29-6.3-1.42 1.42 6.3 6.29-6.3 6.29 1.42 1.42L12 14.83l6.29 6.3 1.42-1.42-6.3-6.29 6.3-6.29z" fill="currentColor"/></svg>';
    closeBtn.addEventListener("click", () => close());
    card.appendChild(closeBtn);
  }

  let countdownEl = null;
  if (autoCloseSeconds) {
    countdownEl = document.createElement("div");
    countdownEl.className = "modal-countdown";
    countdownEl.style.cssText = "text-align:center; font-size:0.7rem; color:var(--text-muted); margin-top:12px;";
    countdownEl.textContent = `Closing in ${autoCloseSeconds}s`;
    card.appendChild(countdownEl);
  }

  backdrop.appendChild(card);
  container.appendChild(backdrop);
  container.style.pointerEvents = "auto";

  if (dismissible) {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) close();
    });
  }

  let autoCloseTimer = null;
  let countdownInterval = null;

  if (autoCloseSeconds) {
    let remaining = autoCloseSeconds;
    countdownInterval = setInterval(() => {
      remaining -= 1;
      if (countdownEl) countdownEl.textContent = `Closing in ${Math.max(remaining, 0)}s`;
      if (remaining <= 0) close();
    }, 1000);
  }

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    if (autoCloseTimer) clearTimeout(autoCloseTimer);
    if (countdownInterval) clearInterval(countdownInterval);

    backdrop.classList.remove("anim-backdrop-in");
    backdrop.classList.add("anim-backdrop-out");
    card.classList.remove("anim-pop-in");
    card.classList.add("anim-scale-out");

    setTimeout(() => {
      backdrop.remove();
      container.style.pointerEvents = "none";
    }, 220);

    activeModal = null;
    if (typeof onClose === "function") onClose();
  }

  activeModal = { close };

  if (typeof onMount === "function") {
    onMount(card, close);
  }

  return close;
}

/** Force-closes whatever modal is currently open, if any. */
export function closeModal() {
  if (activeModal) {
    activeModal.close();
  }
}

/**
 * Convenience wrapper for simple confirmation dialogs with two buttons.
 * Returns a Promise<boolean> resolved with the user's choice.
 */
export function confirmModal({ title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false }) {
  return new Promise((resolve) => {
    openModal({
      dismissible: true,
      bodyHtml: `
        <h3 style="margin-bottom:8px;">${escapeHtml(title)}</h3>
        <p style="margin-bottom:20px;">${escapeHtml(message)}</p>
        <div style="display:flex; gap:12px;">
          <button type="button" class="btn-glass btn-ghost" data-modal-cancel>${escapeHtml(cancelLabel)}</button>
          <button type="button" class="btn-glass ${danger ? "btn-danger" : "btn-primary"}" data-modal-confirm>${escapeHtml(confirmLabel)}</button>
        </div>
      `,
      onClose: () => resolve(false),
      onMount: (card, close) => {
        card.querySelector("[data-modal-cancel]").addEventListener("click", () => {
          resolve(false);
          close();
        });
        card.querySelector("[data-modal-confirm]").addEventListener("click", () => {
          resolve(true);
          close();
        });
      },
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}
