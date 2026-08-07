/* ==========================================================================
   SupEarn — js/pages/profile.js
   Profile screen. Shows the Telegram identity and links out to every
   footer/static page (Privacy, Terms, FAQ, About, Contact, Disclaimer).
   ========================================================================== */

import { appState } from "../core/state.js";
import { navigateTo } from "../core/router.js";
import { hapticSelection } from "../core/telegram.js";

const MENU_ITEMS = [
  { page: "privacy", label: "Privacy Policy", icon: '<path d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z" stroke="currentColor" stroke-width="1.6" fill="none"/>' },
  { page: "terms", label: "Terms & Conditions", icon: '<path d="M6 2h9l5 5v15H6V2z" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M9 12h6M9 16h6M9 8h3" stroke="currentColor" stroke-width="1.4"/>' },
  { page: "faq", label: "FAQ", icon: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.2M12 17h.01" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>' },
  { page: "about", label: "About Us", icon: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M12 11v6M12 7v.01" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' },
  { page: "contact", label: "Contact Us", icon: '<path d="M4 4h16v13H7l-3 3V4z" stroke="currentColor" stroke-width="1.6" fill="none"/>' },
  { page: "disclaimer", label: "Disclaimer", icon: '<path d="M12 2L2 20h20L12 2z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/><path d="M12 9v5M12 17v.01" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' },
];

export async function render(container) {
  const telegramUser = appState.get("telegramUser") || {};
  const avatarSrc = telegramUser.profilePhoto || "assets/icons/user-placeholder.svg";

  container.innerHTML = `
    <div class="glass-card profile-header-card">
      <img class="profile-avatar" src="${escapeAttr(avatarSrc)}" alt="Profile photo" onerror="this.src='assets/icons/user-placeholder.svg'" />
      <div style="min-width:0; flex:1;">
        <div class="profile-name">${escapeHtml(telegramUser.displayName || "SupEarn User")}</div>
        ${telegramUser.username ? `<div class="profile-username">@${escapeHtml(telegramUser.username)}</div>` : ""}
        <div class="profile-id-row">
          <svg viewBox="0 0 24 24" width="12" height="12"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 3a7 7 0 110 14 7 7 0 010-14z" fill="currentColor"/></svg>
          ID: ${escapeHtml(telegramUser.telegramId || "")}
        </div>
      </div>
    </div>

    <div class="glass-card profile-menu">
      ${MENU_ITEMS.map(
        (item) => `
        <div class="profile-menu-item" data-nav-page="${item.page}" style="cursor:pointer;">
          <div class="profile-menu-icon"><svg viewBox="0 0 24 24" width="18" height="18">${item.icon}</svg></div>
          <div class="profile-menu-label">${item.label}</div>
          <svg class="profile-menu-chevron" viewBox="0 0 24 24" width="16" height="16"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
      `
      ).join("")}
    </div>

    <div class="app-footer">
      <div class="footer-copyright">© ${new Date().getFullYear()} SupEarn. All rights reserved.</div>
    </div>
  `;

  container.querySelectorAll("[data-nav-page]").forEach((el) => {
    el.addEventListener("click", () => {
      hapticSelection();
      navigateTo(el.dataset.navPage);
    });
  });

  return () => {};
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}
