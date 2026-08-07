/* ==========================================================================
   SupEarn — js/services/adsgram.js
   AdsGram "Task" block integration. AdsGram issues exactly one Task-type
   blockId per app (creating more than one is against their platform
   rules), so this provider surfaces as a single normalized task entry in
   SupEarn's task list, backed by the real AdController.show() Promise —
   which resolves only once the user has watched/completed the placement.
   ========================================================================== */

const SDK_SRC = "https://sad.adsgram.ai/js/sad.min.js";

let sdkLoadPromise = null;
let controller = null;
let controllerBlockId = null;

function loadSdk() {
  if (window.Adsgram) return Promise.resolve();
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      sdkLoadPromise = null;
      reject(new Error("ADSGRAM_SDK_LOAD_FAILED"));
    };
    document.head.appendChild(script);
  });

  return sdkLoadPromise;
}

async function getController(blockId) {
  await loadSdk();
  if (!window.Adsgram) {
    throw new Error("ADSGRAM_SDK_UNAVAILABLE");
  }
  if (controller && controllerBlockId === blockId) {
    return controller;
  }
  controller = window.Adsgram.init({ blockId, debug: false });
  controllerBlockId = blockId;
  return controller;
}

/**
 * Returns SupEarn's normalized task list contribution from AdsGram: a
 * single task card representing the configured Task block. `isCompleted`
 * comes from the caller (SupEarn tracks completions in Firestore, since
 * AdsGram itself doesn't expose a per-user completion status endpoint for
 * client-side reads).
 */
export function getAdsgramTaskEntries(settings, isCompleted) {
  if (!settings || !settings.adsgramBlockId) return [];

  return [
    {
      id: `adsgram_${settings.adsgramBlockId}`,
      provider: "AdsGram",
      title: "Complete AdsGram Sponsored Task",
      description: "Complete this sponsored placement from AdsGram's partner network to earn coins.",
      reward: settings.watchRewardCoins || 10,
      estimatedTime: "1 min",
      iconLetter: "A",
      status: isCompleted ? "completed" : "start",
      blockId: settings.adsgramBlockId,
    },
  ];
}

/**
 * Triggers the AdsGram Task placement. Resolves true only if
 * AdController.show() resolves (watched fully / completed); resolves
 * false on skip, error, or unavailable SDK rather than throwing, so
 * callers can branch on a simple boolean without a try/catch.
 */
export async function startAdsgramTask(blockId) {
  try {
    const ctrl = await getController(blockId);
    await ctrl.show();
    return true;
  } catch (err) {
    return false;
  }
}
