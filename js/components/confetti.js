/* ==========================================================================
   SupEarn — js/components/confetti.js
   Lightweight confetti burst. Pure DOM + CSS animation (see .confetti-piece
   / @keyframes confetti-fall in animations.css) — no canvas, no library.
   ========================================================================== */

const CONFETTI_COLORS = ["#22d3ee", "#3b82f6", "#fbbf24", "#34d399", "#f472b6"];

/**
 * Bursts a configurable number of confetti pieces from the top of the
 * viewport. Pieces remove themselves after their fall animation ends.
 */
export function triggerConfetti(pieceCount = 36) {
  const viewportWidth = window.innerWidth;

  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";

    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const left = Math.random() * viewportWidth;
    const duration = 1200 + Math.random() * 900;
    const fallDistance = window.innerHeight * (0.5 + Math.random() * 0.5);
    const rotateAmount = 360 + Math.random() * 540;
    const isCircle = Math.random() > 0.5;

    piece.style.left = `${left}px`;
    piece.style.background = color;
    piece.style.borderRadius = isCircle ? "50%" : "2px";
    piece.style.setProperty("--fall-duration", `${duration}ms`);
    piece.style.setProperty("--fall-distance", `${fallDistance}px`);
    piece.style.setProperty("--fall-rotate", `${rotateAmount}deg`);
    piece.style.animationDelay = `${Math.random() * 200}ms`;

    document.body.appendChild(piece);

    setTimeout(() => piece.remove(), duration + 400);
  }
}
