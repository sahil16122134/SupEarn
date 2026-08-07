/* ==========================================================================
   SupEarn — js/services/network.js
   Online/offline detection. navigator.onLine alone only reflects whether a
   network interface is up, not real internet access, so we back it with a
   lightweight periodic reachability probe.
   ========================================================================== */

import { appState } from "../core/state.js";
import { toastWarning, toastSuccess } from "./toast.js";

const PROBE_INTERVAL_MS = 15000;
const PROBE_TIMEOUT_MS = 5000;

let bannerEl = null;
let probeTimer = null;
let hasAnnouncedOnce = false;

async function probeRealConnectivity() {
  if (!navigator.onLine) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    await fetch(`manifest.json?probe=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return true;
  } catch (err) {
    return false;
  }
}

function applyOnlineState(nextOnline) {
  const prevOnline = appState.get("isOnline");
  appState.set("isOnline", nextOnline);

  if (bannerEl) {
    bannerEl.classList.toggle("hidden", nextOnline);
  }

  if (hasAnnouncedOnce && prevOnline !== nextOnline) {
    if (nextOnline) {
      toastSuccess("Internet restored");
    } else {
      toastWarning("No internet connection");
    }
  }
  hasAnnouncedOnce = true;
}

async function runProbeCycle() {
  const online = await probeRealConnectivity();
  applyOnlineState(online);
}

/**
 * Starts monitoring connectivity. Call once at startup after the app
 * shell has been rendered (so #offline-banner exists in the DOM).
 */
export function initNetworkMonitor() {
  bannerEl = document.getElementById("offline-banner");

  window.addEventListener("online", runProbeCycle);
  window.addEventListener("offline", () => applyOnlineState(false));

  runProbeCycle();
  probeTimer = window.setInterval(runProbeCycle, PROBE_INTERVAL_MS);
}

export function stopNetworkMonitor() {
  if (probeTimer) {
    clearInterval(probeTimer);
    probeTimer = null;
  }
}

export function isOnline() {
  return appState.get("isOnline");
}

export function subscribeOnline(callback) {
  return appState.subscribe("isOnline", callback);
}

/**
 * Guard helper for actions that require connectivity (Watch & Earn,
 * Tasks, Redeem). Shows a toast and returns false if offline.
 */
export function requireOnline() {
  if (isOnline()) return true;
  toastWarning("This action needs an internet connection.");
  return false;
}
