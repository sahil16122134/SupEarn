/* ==========================================================================
   SupEarn — js/components/pull-to-refresh.js
   Touch-driven pull-to-refresh. Attached once to the page outlet; reads
   whatever content is currently inside it at gesture time so it survives
   the router swapping page content in and out.
   ========================================================================== */

const PULL_THRESHOLD = 72;
const MAX_PULL = 120;

/**
 * Attaches pull-to-refresh to `scrollEl`. `onRefresh` should return a
 * Promise (or be async); the indicator spins until it resolves.
 * Returns a detach() function.
 */
export function attachPullToRefresh(scrollEl, onRefresh) {
  if (!scrollEl) return () => {};

  const indicator = document.createElement("div");
  indicator.className = "ptr-indicator";
  indicator.style.cssText = `
    position:fixed; left:50%; top:calc(var(--header-height) + 10px);
    transform:translate(-50%, -50px); width:38px; height:38px;
    display:flex; align-items:center; justify-content:center;
    border-radius:50%; background:var(--glass-surface-strong);
    border:1px solid var(--glass-border); opacity:0;
    transition:opacity 150ms ease, transform 150ms ease;
    z-index:600; pointer-events:none; box-shadow:var(--shadow-soft);
  `;
  indicator.innerHTML =
    '<svg class="ptr-arrow" viewBox="0 0 24 24" width="18" height="18" style="color:var(--accent-cyan); transition: transform 120ms ease;"><path d="M12 4v13m0 0l-4.5-4.5M12 17l4.5-4.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.appendChild(indicator);
  const arrow = indicator.querySelector(".ptr-arrow");

  let startY = 0;
  let pulling = false;
  let dragging = false;
  let refreshing = false;

  function getContentEl() {
    return scrollEl.firstElementChild;
  }

  function onTouchStart(e) {
    if (refreshing) return;
    if (scrollEl.scrollTop > 0) return;
    startY = e.touches[0].clientY;
    pulling = true;
    dragging = false;
  }

  function onTouchMove(e) {
    if (!pulling || refreshing) return;
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY <= 0) return;

    if (scrollEl.scrollTop > 0) {
      pulling = false;
      return;
    }

    dragging = true;
    const pull = Math.min(deltaY * 0.5, MAX_PULL);

    const content = getContentEl();
    if (content) {
      content.style.transition = "none";
      content.style.transform = `translateY(${pull}px)`;
    }

    indicator.style.opacity = String(Math.min(pull / PULL_THRESHOLD, 1));
    indicator.style.transform = `translate(-50%, ${-50 + Math.min(pull, 60)}px)`;
    if (arrow) {
      arrow.style.transform = pull >= PULL_THRESHOLD ? "rotate(180deg)" : "rotate(0deg)";
    }

    if (pull > 4 && e.cancelable) {
      e.preventDefault();
    }
  }

  async function onTouchEnd() {
    if (!pulling) return;
    pulling = false;

    const content = getContentEl();
    if (!dragging) return;

    const currentTransform = content ? content.style.transform : "";
    const currentPull = currentTransform ? parseFloat(currentTransform.replace(/[^\d.-]/g, "")) || 0 : 0;

    if (content) {
      content.style.transition = "transform var(--dur-base) var(--ease-out)";
    }

    if (currentPull >= PULL_THRESHOLD) {
      refreshing = true;
      indicator.classList.add("ptr-icon");
      indicator.style.opacity = "1";
      indicator.style.transform = "translate(-50%, 6px)";
      if (content) content.style.transform = "translateY(48px)";

      try {
        await onRefresh();
      } catch (err) {
        // Refresh failures are surfaced by the caller via toast; PTR just
        // resets regardless so the user isn't stuck mid-gesture.
      }

      indicator.classList.remove("ptr-icon");
      refreshing = false;
    }

    indicator.style.opacity = "0";
    indicator.style.transform = "translate(-50%, -50px)";
    if (content) content.style.transform = "translateY(0)";
  }

  scrollEl.addEventListener("touchstart", onTouchStart, { passive: true });
  scrollEl.addEventListener("touchmove", onTouchMove, { passive: false });
  scrollEl.addEventListener("touchend", onTouchEnd, { passive: true });
  scrollEl.addEventListener("touchcancel", onTouchEnd, { passive: true });

  return function detach() {
    scrollEl.removeEventListener("touchstart", onTouchStart);
    scrollEl.removeEventListener("touchmove", onTouchMove);
    scrollEl.removeEventListener("touchend", onTouchEnd);
    scrollEl.removeEventListener("touchcancel", onTouchEnd);
    indicator.remove();
  };
}
