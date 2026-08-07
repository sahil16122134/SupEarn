/* ==========================================================================
   SupEarn — js/pages/footer/contact.js
   ========================================================================== */

export async function render(container) {
  container.innerHTML = `
    <div class="static-page-header">
      <h2>Contact Us</h2>
    </div>

    <div class="glass-card static-content">
      <p>Have a question, feedback, or an issue with a redeem request? We're happy to help — reach out through any of the channels below.</p>

      <div class="glass-divider"></div>

      <div class="contact-method">
        <div class="contact-method-icon">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/></svg>
        </div>
        <div>
          <div class="contact-method-label">Email Support</div>
          <div class="contact-method-value">support@supearn.app</div>
        </div>
      </div>

      <div class="contact-method">
        <div class="contact-method-icon">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M9.03 11.28c1.31 2.58 3.42 4.68 6 6l2-2c.28-.28.68-.36 1.03-.24 1.13.37 2.35.57 3.6.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.4 21 3 13.6 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.47.57 3.6.11.35.03.75-.25 1.03l-2 2.65z" fill="currentColor"/></svg>
        </div>
        <div>
          <div class="contact-method-label">Telegram Support Bot</div>
          <div class="contact-method-value">@SupEarnSupportBot</div>
        </div>
      </div>

      <div class="contact-method">
        <div class="contact-method-icon">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z" fill="currentColor"/></svg>
        </div>
        <div>
          <div class="contact-method-label">Response Time</div>
          <div class="contact-method-value">Typically within 24–48 hours</div>
        </div>
      </div>

      <div class="glass-divider"></div>

      <p style="font-size:var(--fs-xs); color:var(--text-muted);">For redeem-related inquiries, please include your Telegram ID and the approximate date of your request so we can locate it quickly.</p>
    </div>
  `;

  return () => {};
}
