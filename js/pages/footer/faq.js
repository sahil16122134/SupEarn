/* ==========================================================================
   SupEarn — js/pages/footer/faq.js
   ========================================================================== */

import { wireExpandable } from "../../components/ui.js";

const FAQS = [
  {
    q: "How do I earn coins on SupEarn?",
    a: "You can earn coins by watching rewarded ads in Watch & Earn, claiming your Daily Login streak reward, completing sponsored tasks in the Tasks tab, and referring friends who complete the required tasks.",
  },
  {
    q: "How much is a coin worth?",
    a: "Coin value is set in the app's live settings and shown throughout the app as an approximate rupee value. The current rate is displayed on your Wallet card on the Home screen.",
  },
  {
    q: "What is the minimum amount I can redeem?",
    a: "UPI redemptions have a configurable minimum balance requirement, shown on the Home and Redeem screens. Gift cards each have their own minimum coin requirement, shown when selecting a brand.",
  },
  {
    q: "How long does a redeem request take?",
    a: "Redeem requests are reviewed manually by our team. Most requests are processed within a few business days. You'll only ever have one pending request at a time.",
  },
  {
    q: "Why was my redeem request rejected?",
    a: "Requests may be rejected due to invalid payment details, suspected fraudulent activity, or policy violations. If rejected, your coins are automatically refunded to your wallet.",
  },
  {
    q: "What happens if I miss a day in my login streak?",
    a: "If you don't claim your Daily Login reward for a full day, your streak resets back to Day 1 the next time you claim.",
  },
  {
    q: "Why didn't I get a reward after watching an ad?",
    a: "Rewards are only granted when an ad is watched to completion and confirmed by our ad partner. If you skip, close, or the ad fails to load, no reward is given — you can simply try again.",
  },
  {
    q: "Is SupEarn free to use?",
    a: "Yes, SupEarn is completely free to use. You earn coins by engaging with ads and tasks from our partners.",
  },
];

export async function render(container) {
  container.innerHTML = `
    <div class="static-page-header">
      <h2>Frequently Asked Questions</h2>
    </div>

    <div class="faq-list">
      ${FAQS.map(
        (item, idx) => `
        <div class="glass-card faq-item" id="faq-item-${idx}">
          <div class="faq-question" data-faq-toggle="${idx}">
            <span>${escapeHtml(item.q)}</span>
            <svg class="expandable-chevron" viewBox="0 0 24 24" width="16" height="16"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="faq-answer">${escapeHtml(item.a)}</div>
        </div>
      `
      ).join("")}
    </div>
  `;

  FAQS.forEach((_, idx) => {
    const item = container.querySelector(`#faq-item-${idx}`);
    const toggle = container.querySelector(`[data-faq-toggle="${idx}"]`);
    wireExpandable(toggle, item, { openClass: "is-open" });
  });

  return () => {};
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}
