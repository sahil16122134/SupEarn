/* ==========================================================================
   SupEarn — js/services/ads-monetag.js
   Monetag Rewarded Ads integration. The rewarded-ad zone ID is read from
   Firebase settings (rewardedAdId) so it can be changed without a redeploy.
   Monetag's show_<zoneId>() Promise resolves only on a confirmed full ad
   view and rejects on skip/close/failure — that resolution is the only
   signal SupEarn ever trusts before crediting coins.
   ========================================================================== */

let loadedZoneId = null;
let loadingPromise = null;

function sdkFunctionName(zoneId) {
  return `show_${zoneId}`;
}

function loadMonetagSdk(zoneId) {
  if (loadedZoneId === zoneId && typeof window[sdkFunctionName(zoneId)] === "function") {
    return Promise.resolve();
  }
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-zone="${zoneId}"]`);
    if (existing) {
      loadedZoneId = zoneId;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "//libtl.com/sdk.js";
    script.dataset.zone = zoneId;
    script.dataset.sdk = sdkFunctionName(zoneId);
    script.async = true;
    script.onload = () => {
      loadedZoneId = zoneId;
      resolve();
    };
    script.onerror = () => {
      loadingPromise = null;
      reject(new Error("MONETAG_SDK_LOAD_FAILED"));
    };
    document.head.appendChild(script);
  });

  return loadingPromise;
}

/**
 * Loads the Monetag SDK ahead of time so the first "Watch Ad" tap doesn't
 * pay the script-load latency. Safe to call multiple times / speculatively.
 */
export async function preloadMonetagAd(zoneId) {
  if (!zoneId) return;
  try {
    await loadMonetagSdk(zoneId);
  } catch (err) {
    // Preloading is best-effort; showRewardedAd() will retry and surface
    // a real error to the user if it's still unavailable when tapped.
  }
}

/**
 * Shows a Monetag rewarded interstitial and resolves true only if the ad
 * was confirmed fully viewed. Resolves false (never throws to the caller)
 * for skip/close/failure so callers can branch on a simple boolean.
 */
export async function showRewardedAd(zoneId) {
  if (!zoneId) {
    throw new Error("MONETAG_ZONE_NOT_CONFIGURED");
  }

  await loadMonetagSdk(zoneId);

  const showFn = window[sdkFunctionName(zoneId)];
  if (typeof showFn !== "function") {
    throw new Error("MONETAG_SDK_UNAVAILABLE");
  }

  try {
    await showFn({
      type: "inApp",
      inAppSettings: {
        frequency: 1,
        capping: 0,
        interval: 0,
        timeout: 5,
        everyPage: false,
      },
    });
    // Promise resolved: Monetag confirms the rewarded view completed.
    return true;
  } catch (err) {
    // Promise rejected: user skipped/closed early, or no fill was
    // available. Never reward in this branch.
    return false;
  }
}
