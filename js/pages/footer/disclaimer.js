/* ==========================================================================
   SupEarn — js/pages/footer/disclaimer.js
   ========================================================================== */

export async function render(container) {
  container.innerHTML = `
    <div class="static-page-header">
      <h2>Disclaimer</h2>
    </div>
    <div class="static-updated">Last updated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>

    <div class="glass-card static-content">
      <div class="static-block">
        <h4>General Information</h4>
        <p>The information and features provided within SupEarn are for general use only. While we strive to keep reward rates, task availability, and redeem thresholds accurate and up to date, these values are configurable and may change without prior notice.</p>
      </div>

      <div class="static-block">
        <h4>No Guaranteed Earnings</h4>
        <p>SupEarn does not guarantee any specific amount of earnings. Coin rewards depend on ad and task availability from our third-party partners, which can vary based on region, demand, and provider supply at any given time.</p>
      </div>

      <div class="static-block">
        <h4>Third-Party Content</h4>
        <p>Advertisements and sponsored tasks displayed within SupEarn are provided by independent third-party networks (Monetag, TADS, AdsGram, and Adeasly). We do not control, and are not responsible for, the content, accuracy, or claims made within third-party advertisements or tasks.</p>
      </div>

      <div class="static-block">
        <h4>Redeem Processing</h4>
        <p>Gift card and UPI redemptions are subject to manual review and may be delayed or declined due to fraud prevention checks, incorrect payment details, or provider-side issues outside our control. We are not liable for delays caused by third-party payment or gift card providers.</p>
      </div>

      <div class="static-block">
        <h4>Not Financial Advice</h4>
        <p>Nothing within SupEarn constitutes financial, investment, or legal advice. Coins and their rupee-equivalent display are for informational purposes within the app's reward system only.</p>
      </div>

      <div class="static-block">
        <h4>Service Availability</h4>
        <p>SupEarn is provided on an "as available" basis. We do not guarantee uninterrupted access and are not liable for losses resulting from downtime, maintenance, or technical issues affecting the app or its partners.</p>
      </div>

      <div class="static-block">
        <h4>Limitation</h4>
        <p>By using SupEarn, you acknowledge and accept the terms of this Disclaimer in addition to our Terms &amp; Conditions and Privacy Policy.</p>
      </div>
    </div>
  `;

  return () => {};
}
