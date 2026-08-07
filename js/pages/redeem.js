/* ==========================================================================
   SupEarn — js/pages/redeem.js
   Redeem screen. UPI and Gift Card methods, full client-side validation
   before ever touching Firestore, and an atomic debit+request-creation
   transaction that also guards against a second concurrent request.
   ========================================================================== */

import { appState, formatCoins, formatRupees, redeemProgressPercent } from "../core/state.js";
import { createRedeemRequestTx } from "../core/firestore.js";
import { requireOnline } from "../services/network.js";
import { toastError } from "../services/toast.js";
import { openModal } from "../components/modal.js";
import { renderBannerAd } from "../services/ads-tads.js";
import { isValidEmail, isValidUpiId } from "../core/utils.js";
import { hapticNotification, hapticSelection } from "../core/telegram.js";
import { navigateTo } from "../core/router.js";

const GIFT_BRANDS = [
  { key: "amazon", name: "Amazon" },
  { key: "flipkart", name: "Flipkart" },
  { key: "myntra", name: "Myntra" },
];

export async function render(container) {
  const user = appState.get("appUser") || {};
  const settings = appState.get("settings") || {};

  if (user.pendingRedeemId) {
    renderPendingState(container);
    return () => {};
  }

  let selectedMethod = null; // "upi" | "giftcard"
  let selectedBrand = null;
  let isSubmitting = false;

  const giftMinEntries = GIFT_BRANDS.map((b) => ({
    ...b,
    minCoins: (settings.giftCardMinimums && settings.giftCardMinimums[b.key]) || 0,
  }));

  container.innerHTML = `
    <div class="glass-card redeem-summary-card">
      <div class="redeem-summary-row">
        <span class="redeem-summary-label">Wallet Balance</span>
        <span class="redeem-summary-value mono">${formatCoins(user.coinBalance)} coins</span>
      </div>
      <div class="redeem-summary-row">
        <span class="redeem-summary-label">≈ Rupee Value</span>
        <span class="redeem-summary-value mono" style="color:var(--success);">${formatRupees(user.coinBalance)}</span>
      </div>
      <div class="wallet-progress-block" style="margin-top:4px;">
        <div class="wallet-progress-header">
          <span class="wallet-progress-title">Min. UPI Redeem ${formatRupees(settings.minimumUpiRedeem)}</span>
          <span class="wallet-progress-fraction mono">${formatCoins(user.coinBalance)} / ${formatCoins(settings.minimumUpiRedeem)}</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${redeemProgressPercent()}%;"></div></div>
      </div>
    </div>

    <div class="page-section-title">Choose Redeem Method</div>
    <div class="redeem-methods">

      <div class="glass-card redeem-method-card" id="method-upi">
        <div class="redeem-method-header" data-method-header="upi">
          <div class="redeem-method-icon">
            <svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="var(--accent-cyan)" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>
          </div>
          <div style="flex:1;">
            <div class="redeem-method-title">UPI</div>
            <div class="redeem-method-subtitle">Min. ${formatRupees(settings.minimumUpiRedeem)}</div>
          </div>
          <div class="redeem-method-radio"></div>
        </div>
        <div class="redeem-method-form">
          <div class="field">
            <label for="upi-id-input">UPI ID</label>
            <input type="text" id="upi-id-input" placeholder="yourname@bank" autocomplete="off" />
            <div class="field-error" id="upi-id-error"></div>
          </div>
          <div class="field">
            <label for="upi-amount-input">Amount (coins)</label>
            <input type="number" id="upi-amount-input" min="${settings.minimumUpiRedeem}" max="${user.coinBalance}" step="1" value="${Math.min(user.coinBalance, settings.minimumUpiRedeem)}" />
            <div class="field-error" id="upi-amount-error"></div>
          </div>
          <button type="button" class="btn-glass btn-primary redeem-submit-btn" id="submit-upi-btn">Submit Redeem Request</button>
        </div>
      </div>

      <div class="glass-card redeem-method-card" id="method-giftcard">
        <div class="redeem-method-header" data-method-header="giftcard">
          <div class="redeem-method-icon">
            <svg viewBox="0 0 24 24" width="22" height="22"><rect x="3" y="7" width="18" height="13" rx="2" stroke="var(--accent-cyan)" stroke-width="1.6" fill="none"/><path d="M3 11h18M12 7v13" stroke="var(--accent-cyan)" stroke-width="1.6"/></svg>
          </div>
          <div style="flex:1;">
            <div class="redeem-method-title">Gift Card</div>
            <div class="redeem-method-subtitle">Amazon, Flipkart, Myntra</div>
          </div>
          <div class="redeem-method-radio"></div>
        </div>
        <div class="redeem-method-form">
          <div class="giftcard-brand-grid" id="giftcard-brand-grid">
            ${giftMinEntries
              .map(
                (b) => `
              <button type="button" class="giftcard-brand" data-brand="${b.key}">
                <span class="giftcard-brand-name">${b.name}</span>
                <span class="giftcard-brand-min mono">${formatCoins(b.minCoins)}</span>
              </button>
            `
              )
              .join("")}
          </div>
          <div class="field">
            <label for="giftcard-email-input">Email Address</label>
            <input type="email" id="giftcard-email-input" placeholder="you@example.com" autocomplete="off" />
            <div class="field-error" id="giftcard-email-error"></div>
          </div>
          <button type="button" class="btn-glass btn-primary redeem-submit-btn" id="submit-giftcard-btn">Submit Redeem Request</button>
        </div>
      </div>
    </div>
  `;

  const methodUpiEl = container.querySelector("#method-upi");
  const methodGiftEl = container.querySelector("#method-giftcard");

  function selectMethod(method) {
    selectedMethod = selectedMethod === method ? null : method;
    methodUpiEl.classList.toggle("is-selected", selectedMethod === "upi");
    methodGiftEl.classList.toggle("is-selected", selectedMethod === "giftcard");
  }

  container.querySelector('[data-method-header="upi"]').addEventListener("click", () => {
    hapticSelection();
    selectMethod("upi");
  });
  container.querySelector('[data-method-header="giftcard"]').addEventListener("click", () => {
    hapticSelection();
    selectMethod("giftcard");
  });

  container.querySelector("#giftcard-brand-grid").addEventListener("click", (e) => {
    const chip = e.target.closest(".giftcard-brand");
    if (!chip) return;
    hapticSelection();
    selectedBrand = chip.dataset.brand;
    container.querySelectorAll(".giftcard-brand").forEach((c) => c.classList.toggle("is-selected", c === chip));
  });

  container.querySelector("#submit-upi-btn").addEventListener("click", () => submitUpi());
  container.querySelector("#submit-giftcard-btn").addEventListener("click", () => submitGiftCard());

  async function submitUpi() {
    if (isSubmitting) return;
    if (!requireOnline()) return;

    const upiInput = container.querySelector("#upi-id-input");
    const amountInput = container.querySelector("#upi-amount-input");
    const upiErrorEl = container.querySelector("#upi-id-error");
    const amountErrorEl = container.querySelector("#upi-amount-error");
    upiErrorEl.textContent = "";
    amountErrorEl.textContent = "";

    const upiId = upiInput.value.trim();
    const amountCoins = parseInt(amountInput.value, 10);

    if (!isValidUpiId(upiId)) {
      upiErrorEl.textContent = "Enter a valid UPI ID (e.g. name@bank).";
      shake(upiInput);
      return;
    }
    if (!Number.isFinite(amountCoins) || amountCoins < settings.minimumUpiRedeem) {
      amountErrorEl.textContent = `Minimum redeem amount is ${formatCoins(settings.minimumUpiRedeem)} coins.`;
      shake(amountInput);
      return;
    }
    if (amountCoins > user.coinBalance) {
      amountErrorEl.textContent = "You don't have enough coins for this amount.";
      shake(amountInput);
      return;
    }

    await submitRequest(
      {
        redeemType: "upi",
        upiId,
        username: appState.get("telegramUser").username,
        profilePhoto: appState.get("telegramUser").profilePhoto,
      },
      amountCoins,
      container.querySelector("#submit-upi-btn")
    );
  }

  async function submitGiftCard() {
    if (isSubmitting) return;
    if (!requireOnline()) return;

    const emailInput = container.querySelector("#giftcard-email-input");
    const emailErrorEl = container.querySelector("#giftcard-email-error");
    emailErrorEl.textContent = "";

    if (!selectedBrand) {
      toastError("Please select a gift card brand.");
      return;
    }
    const email = emailInput.value.trim();
    if (!isValidEmail(email)) {
      emailErrorEl.textContent = "Enter a valid email address.";
      shake(emailInput);
      return;
    }

    const brandEntry = giftMinEntries.find((b) => b.key === selectedBrand);
    const amountCoins = brandEntry ? brandEntry.minCoins : 0;

    if (amountCoins > user.coinBalance) {
      toastError(`You need at least ${formatCoins(amountCoins)} coins for a ${brandEntry.name} gift card.`);
      return;
    }

    await submitRequest(
      {
        redeemType: "giftcard",
        giftCardBrand: selectedBrand,
        email,
        username: appState.get("telegramUser").username,
        profilePhoto: appState.get("telegramUser").profilePhoto,
      },
      amountCoins,
      container.querySelector("#submit-giftcard-btn")
    );
  }

  async function submitRequest(payload, amountCoins, buttonEl) {
    isSubmitting = true;
    const originalLabel = buttonEl.textContent;
    buttonEl.disabled = true;
    buttonEl.innerHTML = '<span class="spinner"></span>';

    try {
      const firebaseUid = appState.get("firebaseUid");
      const telegramId = appState.get("telegramUser").telegramId;
      await createRedeemRequestTx(firebaseUid, telegramId, payload, amountCoins);
      hapticNotification("success");
      showConfirmationPopup(amountCoins);
    } catch (err) {
      hapticNotification("error");
      isSubmitting = false;
      buttonEl.disabled = false;
      buttonEl.textContent = originalLabel;

      if (err && err.message === "PENDING_REQUEST_EXISTS") {
        toastError("You already have a pending redeem request.");
      } else if (err && err.message === "INSUFFICIENT_BALANCE") {
        toastError("Insufficient balance for this redeem amount.");
      } else {
        toastError("Couldn't submit your redeem request. Please try again.");
      }
    }
  }

  function showConfirmationPopup(amountCoins) {
    openModal({
      autoCloseSeconds: settings.popupCloseSeconds || 5,
      dismissible: false,
      bodyHtml: `
        <div style="text-align:center; padding-top:8px;">
          <div style="width:64px; height:64px; margin:0 auto 14px; border-radius:50%; background:var(--success-dim); display:flex; align-items:center; justify-content:center;">
            <svg viewBox="0 0 24 24" width="30" height="30"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" fill="var(--success)"/></svg>
          </div>
          <h3 style="margin-bottom:6px;">Redeem Request Submitted</h3>
          <p style="margin-bottom:16px;">Your request for <strong class="mono">${formatCoins(amountCoins)} coins</strong> (${formatRupees(amountCoins)}) is being reviewed.</p>
          <div class="banner-ad-slot is-empty" id="redeem-popup-banner" style="min-height:60px;"></div>
        </div>
      `,
      onMount: (card) => {
        renderBannerAd(card.querySelector("#redeem-popup-banner"), settings.bannerAdId);
      },
      onClose: () => {
        navigateTo("redeem", {}, { replace: true });
      },
    });
  }

  function shake(el) {
    el.classList.remove("anim-shake");
    void el.offsetWidth;
    el.classList.add("anim-shake");
  }

  return () => {};
}

function renderPendingState(container) {
  const user = appState.get("appUser") || {};
  container.innerHTML = `
    <div class="glass-card redeem-pending-card">
      <div class="redeem-pending-icon">
        <svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/></svg>
      </div>
      <div>
        <h4 style="margin-bottom:2px;">Redeem Request Pending</h4>
        <p>Your previous redeem request is still being reviewed. You can submit a new one once it's processed.</p>
      </div>
    </div>
    <div class="glass-card redeem-summary-card">
      <div class="redeem-summary-row">
        <span class="redeem-summary-label">Wallet Balance</span>
        <span class="redeem-summary-value mono">${formatCoins(user.coinBalance)} coins</span>
      </div>
    </div>
  `;
}
