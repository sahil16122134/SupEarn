/* ==========================================================================
   SupEarn — js/pages/footer/privacy.js
   ========================================================================== */

export async function render(container) {
  container.innerHTML = `
    <div class="static-page-header">
      <h2>Privacy Policy</h2>
    </div>
    <div class="static-updated">Last updated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>

    <div class="glass-card static-content">
      <div class="static-block">
        <h4>Overview</h4>
        <p>SupEarn ("we", "us", "our") operates as a Telegram Mini App that lets users earn coin rewards by watching ads and completing tasks, redeemable for UPI payments or gift cards. This policy explains what information we collect, how we use it, and the choices you have.</p>
      </div>

      <div class="static-block">
        <h4>Information We Collect</h4>
        <p>When you open SupEarn through Telegram, we automatically receive the following information from Telegram's platform:</p>
        <ul>
          <li>Your Telegram ID, username, first and last name</li>
          <li>Your Telegram profile photo (if public)</li>
          <li>Your Telegram-configured language preference</li>
        </ul>
        <p>When you use redeem features, we additionally collect the UPI ID or email address you provide for the purpose of processing your reward payout.</p>
      </div>

      <div class="static-block">
        <h4>How We Use Your Information</h4>
        <ul>
          <li>To create and maintain your SupEarn account and coin wallet</li>
          <li>To process redeem requests via UPI or gift card providers</li>
          <li>To prevent fraud, duplicate accounts, and abuse of the reward system</li>
          <li>To display your Telegram name and photo within the app interface</li>
          <li>To communicate important account or service updates when necessary</li>
        </ul>
      </div>

      <div class="static-block">
        <h4>Third-Party Services</h4>
        <p>SupEarn integrates with third-party advertising and task networks (Monetag, TADS, AdsGram, and Adeasly) to deliver rewarded ads and sponsored tasks. These providers may independently collect technical data such as device type and interaction events, subject to their own privacy policies. We do not share your UPI ID, email, or Telegram identity with these providers beyond what's required for standard ad delivery.</p>
      </div>

      <div class="static-block">
        <h4>Data Storage &amp; Security</h4>
        <p>Your account data is stored securely using Firebase, with access restricted by strict security rules so that only you can read or modify your own wallet and redeem information. We do not sell your personal information to third parties.</p>
      </div>

      <div class="static-block">
        <h4>Data Retention</h4>
        <p>We retain your account information for as long as your SupEarn account remains active. Redeem requests are removed from our systems once processed (approved or rejected) by our team.</p>
      </div>

      <div class="static-block">
        <h4>Your Rights</h4>
        <p>You may request deletion of your account and associated data at any time by contacting us through the Contact Us page. Once verified, we will remove your data within a reasonable timeframe, except where retention is required for fraud prevention or legal compliance.</p>
      </div>

      <div class="static-block">
        <h4>Changes to This Policy</h4>
        <p>We may update this Privacy Policy from time to time. Material changes will be reflected on this page with an updated "Last updated" date.</p>
      </div>

      <div class="static-block">
        <h4>Contact Us</h4>
        <p>If you have questions about this Privacy Policy, please reach out via the Contact Us page in the app.</p>
      </div>
    </div>
  `;

  return () => {};
}
