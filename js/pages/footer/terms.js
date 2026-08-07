/* ==========================================================================
   SupEarn — js/pages/footer/terms.js
   ========================================================================== */

export async function render(container) {
  container.innerHTML = `
    <div class="static-page-header">
      <h2>Terms &amp; Conditions</h2>
    </div>
    <div class="static-updated">Last updated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>

    <div class="glass-card static-content">
      <div class="static-block">
        <h4>Acceptance of Terms</h4>
        <p>By accessing or using SupEarn, you agree to be bound by these Terms &amp; Conditions. If you do not agree, please discontinue use of the app.</p>
      </div>

      <div class="static-block">
        <h4>Eligibility</h4>
        <p>SupEarn is intended for users who are legally permitted to use Telegram Mini Apps in their jurisdiction and who are of legal age to enter into binding agreements, or have the consent of a parent or guardian where required by local law.</p>
      </div>

      <div class="static-block">
        <h4>How Coins Are Earned</h4>
        <ul>
          <li>Watching rewarded advertisements through the Watch &amp; Earn feature</li>
          <li>Claiming the Daily Login streak reward</li>
          <li>Completing sponsored tasks from our task partners</li>
          <li>Referring friends who complete the required number of tasks</li>
        </ul>
        <p>Reward amounts are configurable and may change at any time without prior notice. Coins have no cash value until successfully redeemed according to these Terms.</p>
      </div>

      <div class="static-block">
        <h4>Redeeming Coins</h4>
        <p>Coins may be redeemed for UPI transfer or supported gift cards once your balance meets the applicable minimum threshold. Redeem requests are reviewed manually and may be approved or rejected at our discretion, including for suspected fraud, duplicate accounts, or violation of these Terms. Rejected requests are refunded to your coin balance.</p>
      </div>

      <div class="static-block">
        <h4>Prohibited Conduct</h4>
        <ul>
          <li>Using bots, emulators, or automated tools to farm rewards</li>
          <li>Creating multiple accounts to abuse referral or reward systems</li>
          <li>Attempting to exploit, reverse-engineer, or interfere with the app or its ad partners</li>
          <li>Providing false or fraudulent redeem information</li>
        </ul>
        <p>Violation of these rules may result in suspension of your account and forfeiture of unredeemed coins.</p>
      </div>

      <div class="static-block">
        <h4>Third-Party Advertising &amp; Task Partners</h4>
        <p>SupEarn relies on third-party ad and task networks to fund rewards. We are not responsible for the content, availability, or accuracy of third-party advertisements or tasks, and reward availability may fluctuate based on partner supply.</p>
      </div>

      <div class="static-block">
        <h4>Changes to the Service</h4>
        <p>We may modify, suspend, or discontinue any part of SupEarn — including reward rates, redeem minimums, or available task providers — at any time.</p>
      </div>

      <div class="static-block">
        <h4>Limitation of Liability</h4>
        <p>SupEarn is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the app, including delays or failures in ad delivery, task availability, or redeem processing.</p>
      </div>

      <div class="static-block">
        <h4>Governing Law</h4>
        <p>These Terms are governed by applicable local law in the jurisdiction where SupEarn's operator is registered, without regard to conflict-of-law principles.</p>
      </div>

      <div class="static-block">
        <h4>Contact</h4>
        <p>Questions about these Terms can be directed to us through the Contact Us page.</p>
      </div>
    </div>
  `;

  return () => {};
}
