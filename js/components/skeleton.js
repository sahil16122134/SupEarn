/* ==========================================================================
   SupEarn — js/components/skeleton.js
   Skeleton loading placeholders. Every page shows these instead of a blank
   screen while its first Firestore snapshot / provider response is
   in flight. Uses the .skeleton shimmer class defined in animations.css.
   ========================================================================== */

/** Returns a single skeleton block of the given size/shape. */
export function skeletonBlock({ width = "100%", height = "16px", radius = "var(--radius-sm)" } = {}) {
  return `<div class="skeleton" style="width:${width}; height:${height}; border-radius:${radius};"></div>`;
}

/** A skeleton line group simulating a title + subtitle pair. */
export function skeletonTextLines(lines = [{ width: "60%" }, { width: "40%" }]) {
  return `
    <div style="display:flex; flex-direction:column; gap:8px;">
      ${lines
        .map((l) => skeletonBlock({ width: l.width || "100%", height: l.height || "12px" }))
        .join("")}
    </div>
  `;
}

/** Full home-screen skeleton: wallet card + three action cards. */
export function homeSkeleton() {
  return `
    <div class="glass-card home-skeleton-wallet"></div>
    <div class="action-cards">
      <div class="glass-card home-skeleton-card"></div>
      <div class="glass-card home-skeleton-card"></div>
      <div class="glass-card home-skeleton-card"></div>
    </div>
  `;
}

/** Repeated task-row skeletons for the Tasks screen. */
export function taskListSkeleton(count = 5) {
  return Array.from({ length: count })
    .map(() => `<div class="glass-card task-skeleton"></div>`)
    .join("");
}

/** Generic card-shaped skeleton, repeated `count` times, for any list page. */
export function cardListSkeleton(count = 3, height = "80px") {
  return Array.from({ length: count })
    .map(() => `<div class="glass-card" style="height:${height};" ><div class="skeleton" style="width:100%; height:100%; border-radius:var(--radius-md);"></div></div>`)
    .join("");
}

/** Renders a skeleton set into a container, replacing its current content. */
export function showSkeleton(container, html) {
  if (!container) return;
  container.innerHTML = html;
}
