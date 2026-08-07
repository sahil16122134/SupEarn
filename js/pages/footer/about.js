/* ==========================================================================
   SupEarn — js/pages/footer/about.js
   ========================================================================== */

export async function render(container) {
  container.innerHTML = `
    <div class="glass-card about-hero">
      <div class="about-hero-logo">
        <svg viewBox="0 0 64 64" width="40" height="40">
          <defs>
            <linearGradient id="aboutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#22D3EE" /><stop offset="100%" stop-color="#3B82F6" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="22" fill="none" stroke="url(#aboutGrad)" stroke-width="3" />
          <path d="M22 34c0 6 4 10 10 10s10-3 10-8-4-7-10-8-10-3-10-8 4-8 10-8 9 3 10 7" fill="none" stroke="url(#aboutGrad)" stroke-width="3" stroke-linecap="round" />
        </svg>
      </div>
      <h2 style="margin-bottom:4px;">About SupEarn</h2>
      <p>Turning a few spare minutes into real rewards.</p>
    </div>

    <div class="glass-card static-content">
      <div class="static-block">
        <h4>Our Mission</h4>
        <p>SupEarn was built to give people a simple, trustworthy way to earn real rewards during everyday moments spent on Telegram — whether that's watching a short ad, completing a quick sponsored task, or keeping a daily habit going with our login streak.</p>
      </div>

      <div class="static-block">
        <h4>What Makes SupEarn Different</h4>
        <ul>
          <li>Transparent coin economy with a clear, always-visible rupee value</li>
          <li>Fast, native Telegram experience — no separate app to install</li>
          <li>Multiple ways to earn: ads, daily streaks, sponsored tasks, and referrals</li>
          <li>Real payouts via UPI or popular gift card brands</li>
        </ul>
      </div>

      <div class="static-block">
        <h4>How It Works</h4>
        <p>Every action you take in SupEarn — watching an ad, completing a task, logging in daily — adds coins to your wallet. Once you reach the minimum threshold, you can redeem your balance for UPI cash or a gift card of your choice.</p>
      </div>

      <div class="static-block">
        <h4>Our Commitment</h4>
        <p>We're committed to fair reward distribution, prompt redeem processing, and keeping your data secure. If something ever feels off, our Contact Us page is always open.</p>
      </div>
    </div>
  `;

  return () => {};
}
