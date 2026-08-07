/* ==========================================================================
   SupEarn — js/services/ads-tads.js
   TADS Banner Ads integration. Banner ad unit ID is read from Firebase
   settings (bannerAdId) so placements can be changed without a redeploy.
   ========================================================================== */

/**
 * Base embed URL from your TADS publisher dashboard banner snippet.
 * Replace with the exact base URL TADS issues for your account.
 */
const TADS_BANNER_BASE_URL = "https://ads.tads.io/banner";

const LOAD_TIMEOUT_MS = 6000;

/**
 * Renders a TADS banner into `container`. Shows the "Advertisement"
 * placeholder empty-state if no ad unit is configured, or if the ad
 * fails to load / times out. Returns a cleanup function to call when the
 * hosting page unmounts (removes the iframe, clears timers).
 */
export function renderBannerAd(container, bannerAdId) {
  if (!container) return () => {};

  if (!bannerAdId) {
    container.innerHTML = "";
    container.classList.add("is-empty");
    return () => {};
  }

  container.classList.remove("is-empty");
  container.innerHTML = "";

  const iframe = document.createElement("iframe");
  iframe.src = `${TADS_BANNER_BASE_URL}/${encodeURIComponent(bannerAdId)}`;
  iframe.title = "Advertisement";
  iframe.loading = "lazy";
  iframe.setAttribute("scrolling", "no");
  iframe.setAttribute("frameborder", "0");
  iframe.style.cssText = "width:100%; height:100%; min-height:60px; border:0; display:block;";

  let settled = false;

  const fallbackTimer = setTimeout(() => {
    if (!settled) {
      settled = true;
      showFallback(container);
    }
  }, LOAD_TIMEOUT_MS);

  iframe.addEventListener("load", () => {
    settled = true;
    clearTimeout(fallbackTimer);
  });

  iframe.addEventListener("error", () => {
    if (!settled) {
      settled = true;
      clearTimeout(fallbackTimer);
      showFallback(container);
    }
  });

  container.appendChild(iframe);

  return () => {
    clearTimeout(fallbackTimer);
    container.innerHTML = "";
  };
}

function showFallback(container) {
  container.innerHTML = "";
  container.classList.add("is-empty");
}
