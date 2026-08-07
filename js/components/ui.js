/* ==========================================================================
   SupEarn — js/components/ui.js
   Small shared UI behaviors wired globally via event delegation, so pages
   don't need to re-attach listeners every time the router re-renders them.
   ========================================================================== */

/**
 * Call once at startup. Wires button ripple and card-tilt effects
 * globally via delegated listeners on document, so they work on any
 * matching element regardless of when it was added to the DOM.
 */
export function initGlobalUI() {
  document.addEventListener("pointerdown", handleRippleTrigger);
  document.addEventListener("pointermove", handleTiltMove);
  document.addEventListener("pointerout", handleTiltOut);
}

/* ============================================================ */
/* BUTTON RIPPLE                                                  */
/* ============================================================ */

const RIPPLE_TARGET_SELECTOR = ".btn-glass, .filter-chip, .streak-day, .giftcard-brand, .nav-btn";

function handleRippleTrigger(e) {
  const el = e.target.closest(RIPPLE_TARGET_SELECTOR);
  if (!el || el.classList.contains("is-disabled") || el.disabled) return;
  spawnRipple(el, e);
}

function spawnRipple(el, e) {
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.4;
  const x = (e.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2;
  const y = (e.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2;

  if (getComputedStyle(el).position === "static") {
    el.style.position = "relative";
  }
  el.style.overflow = el.style.overflow === "visible" ? "hidden" : el.style.overflow || "hidden";

  const ripple = document.createElement("span");
  ripple.className = "btn-ripple";
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;

  el.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
}

/* ============================================================ */
/* CARD TILT                                                      */
/* ============================================================ */

const TILT_MAX_DEG = 6;

function handleTiltMove(e) {
  const card = e.target.closest(".tilt-card");
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const px = (e.clientX - rect.left) / rect.width;
  const py = (e.clientY - rect.top) / rect.height;
  const tiltX = (0.5 - py) * TILT_MAX_DEG;
  const tiltY = (px - 0.5) * TILT_MAX_DEG;
  card.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
  card.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
}

function handleTiltOut(e) {
  const card = e.target.closest(".tilt-card");
  if (!card) return;
  if (card.contains(e.relatedTarget)) return;
  card.style.setProperty("--tilt-x", "0deg");
  card.style.setProperty("--tilt-y", "0deg");
}

/* ============================================================ */
/* EXPANDABLE / ACCORDION                                         */
/* ============================================================ */

/**
 * Wires a click-to-toggle expandable section. `containerEl` receives the
 * `openClass` and `triggerEl` gets aria-expanded toggled for accessibility.
 */
export function wireExpandable(triggerEl, containerEl, { openClass = "is-expanded", onToggle } = {}) {
  if (!triggerEl || !containerEl) return;
  triggerEl.setAttribute("aria-expanded", "false");
  triggerEl.addEventListener("click", () => {
    const isOpen = containerEl.classList.toggle(openClass);
    triggerEl.setAttribute("aria-expanded", String(isOpen));
    if (typeof onToggle === "function") onToggle(isOpen);
  });
}

/* ============================================================ */
/* FORMATTING / UTILITY                                           */
/* ============================================================ */

/** Formats seconds as "M:SS" once past a minute, or "Ns" under a minute. */
export function formatCountdown(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/** Standard trailing-edge debounce. */
export function debounce(fn, waitMs = 250) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), waitMs);
  };
}

/** Clamps a number between min and max. */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
