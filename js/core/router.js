/* ==========================================================================
   SupEarn — js/core/router.js
   Lightweight SPA router for the page outlet. Two bottom-nav tabs (home,
   tasks) act as history roots; every other screen pushes onto a stack and
   wires the native Telegram back button to pop it.
   ========================================================================== */

import { showBackButton, hapticSelection } from "./telegram.js";
import { appState } from "./state.js";

let pageOutletEl = null;
let bottomNavEl = null;
let registry = {}; // pageName -> { render(container, params) -> Promise<void|cleanupFn>, title? }
let historyStack = []; // [{ name, params }]
let currentCleanup = null;
let isTransitioning = false;

const TAB_PAGES = new Set(["home", "tasks"]);

export function initRouter({ pageOutlet, bottomNav, pages, defaultPage = "home" }) {
  pageOutletEl = pageOutlet;
  bottomNavEl = bottomNav;
  registry = pages;

  if (bottomNavEl) {
    bottomNavEl.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        hapticSelection();
        navigateTo(btn.dataset.page, {}, { isTab: true });
      });
    });
  }

  navigateTo(defaultPage, {}, { isTab: true, replace: true });
}

function updateNavActiveState(pageName) {
  if (!bottomNavEl) return;
  bottomNavEl.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === pageName);
  });
}

/**
 * Navigates to a registered page.
 * options.isTab   — true for the two bottom-nav root pages; resets the
 *                    history stack and hides the native back button.
 * options.replace — replaces the current stack entry instead of pushing.
 * options.modal   — page was opened as a full-screen sub-view (default for
 *                    anything not a tab); pushes and shows the back button.
 */
export async function navigateTo(pageName, params = {}, options = {}) {
  const pageModule = registry[pageName];
  if (!pageModule) {
    console.error(`[router] No page registered for "${pageName}"`);
    return;
  }
  if (isTransitioning) return;
  isTransitioning = true;

  if (options.isTab) {
    historyStack = [{ name: pageName, params }];
    showBackButton(null);
    updateNavActiveState(pageName);
  } else if (options.replace && historyStack.length) {
    historyStack[historyStack.length - 1] = { name: pageName, params };
    showBackButton(historyStack.length > 1 ? goBack : null);
  } else {
    historyStack.push({ name: pageName, params });
    showBackButton(goBack);
    updateNavActiveState(""); // no tab highlighted while on a sub-page
  }

  appState.set("currentPage", pageName);
try {
    await renderCurrentEntry();
} finally {
    isTransitioning = false;
}
}

/**
 * Pops the history stack and renders the previous entry. If already at a
 * root tab page, this is a no-op (the native back button is hidden at
 * that point anyway).
 */
export async function goBack() {
  if (isTransitioning || historyStack.length <= 1) return;
  isTransitioning = true;
  historyStack.pop();
  const top = historyStack[historyStack.length - 1];
  showBackButton(historyStack.length > 1 ? goBack : null);
  updateNavActiveState(TAB_PAGES.has(top.name) ? top.name : "");
  appState.set("currentPage", top.name);
  await renderCurrentEntry();
  isTransitioning = false;
}

async function renderCurrentEntry() {
  const top = historyStack[historyStack.length - 1];
  const pageModule = registry[top.name];

  if (typeof currentCleanup === "function") {
    try {
      currentCleanup();
    } catch (err) {
      console.error("[router] cleanup threw:", err);
    }
    currentCleanup = null;
  }

  // Animate the outgoing content out, then swap and animate in.
  pageOutletEl.classList.add("anim-fade-out");
  await wait(120);

  pageOutletEl.innerHTML = "";
  pageOutletEl.classList.remove("anim-fade-out");

  const container = document.createElement("div");
  container.className = "page anim-slide-up-in";
  pageOutletEl.appendChild(container);
  pageOutletEl.scrollTop = 0;

  try {
    currentCleanup = await pageModule.render(container, top.params);
  } catch (err) {
    console.error(`[router] render failed for "${top.name}":`, err);
    container.innerHTML = renderPageErrorFallback();
    wirePageErrorRetry(container, top.name, top.params);
  }
}

function renderPageErrorFallback() {
  return `
    <div class="glass-card" style="text-align:center; padding: 32px 20px;">
      <h3 style="margin-bottom:8px;">Something went wrong</h3>
      <p style="margin-bottom:16px;">This screen couldn't load. Please try again.</p>
      <button class="btn-glass btn-primary" data-retry-page type="button">Retry</button>
    </div>
  `;
}

function wirePageErrorRetry(container, name, params) {
  const btn = container.querySelector("[data-retry-page]");
  if (btn) {
   btn.addEventListener("click", async () => {
    await renderCurrentEntry();
});
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Returns the name of the currently visible page. */
export function getCurrentPage() {
  const top = historyStack[historyStack.length - 1];
  return top ? top.name : null;
}

/** Forces a re-render of whatever page is currently visible (used by
 *  pull-to-refresh). */
export function refreshCurrentPage() {
  return renderCurrentEntry();
}
