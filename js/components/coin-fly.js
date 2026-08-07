/* ==========================================================================
   SupEarn — js/components/coin-fly.js
   Coin flying animation. Spawns small coin particles at a source element
   and arcs them toward a target element (typically the header avatar or
   wallet balance), reinforcing that a reward just landed in the wallet.
   ========================================================================== */

/**
 * Animates `coinCount` coin particles flying from `fromEl` to `toEl`.
 * Resolves once all particles have finished (useful for sequencing a
 * balance-counter pulse right as the coins "arrive").
 */
export function flyCoinsToWallet(fromEl, toEl, coinCount = 8) {
  return new Promise((resolve) => {
    if (!fromEl || !toEl) {
      resolve();
      return;
    }

    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();

    const startX = fromRect.left + fromRect.width / 2;
    const startY = fromRect.top + fromRect.height / 2;
    const endX = toRect.left + toRect.width / 2;
    const endY = toRect.top + toRect.height / 2;

    const count = Math.max(1, Math.min(coinCount, 14));
    let remaining = count;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement("div");
      particle.className = "coin-particle";

      const jitterX = (Math.random() - 0.5) * 40;
      const jitterY = (Math.random() - 0.5) * 20;
      const flyX = endX - startX + jitterX;
      const flyY = endY - startY + jitterY;

      particle.style.left = `${startX - 11}px`;
      particle.style.top = `${startY - 11}px`;
      particle.style.setProperty("--fly-x", `${flyX}px`);
      particle.style.setProperty("--fly-y", `${flyY}px`);
      particle.style.animationDelay = `${i * 45}ms`;

      document.body.appendChild(particle);

      particle.addEventListener("animationend", () => {
        particle.remove();
        remaining -= 1;
        if (remaining <= 0) resolve();
      });
    }

    // Safety fallback in case an animationend event is ever dropped
    // (e.g. tab backgrounded mid-animation).
    setTimeout(resolve, 1400);
  });
}

/**
 * Applies a one-shot scale/color pulse to a coin counter element right as
 * new coins visually "land" on it.
 */
export function pulseCounter(counterEl) {
  if (!counterEl) return;
  counterEl.classList.remove("counter-pulse");
  // Force reflow so the animation can be retriggered on rapid rewards.
  void counterEl.offsetWidth;
  counterEl.classList.add("counter-pulse");
}
