import { initTelegramApp, triggerHaptic } from './telegram.js';
import { authenticateUser } from './auth.js';
import { state } from './settings.js';
import { showToast } from './ui.js';
import { renderHomeView } from './home.js';
import { renderTasksView } from './tasks.js';
import { initAdsgram, initAdeasly } from './watch.js';
import { openDailyBonusModal } from './daily.js';
import { openRedeemModal } from './redeem.js';
import { openReferralModal } from './referral.js';
import { setupAdminTriggers } from './admin.js';

document.addEventListener('DOMContentLoaded', async () => {
    const splash = document.getElementById('splash-screen');
    const header = document.getElementById('main-header');
    const content = document.getElementById('app-content');
    const nav = document.getElementById('bottom-nav');

    try {
        // 1. Initialize Telegram
        const { user: tgUser } = initTelegramApp();

        // 2. Authenticate
        state.user = await authenticateUser(tgUser);

        // 3. Render Header Details safely
        const nameElem = document.getElementById('user-display-name');
        const handleElem = document.getElementById('user-telegram-handle');
        if (nameElem && state.user?.firstName) nameElem.innerText = state.user.firstName;
        if (handleElem && state.user?.username) handleElem.innerText = `@${state.user.username}`;

        // 4. Render Home View
        if (content) {
            renderHomeView(content);
        }

        // 5. Setup Navigation
        setupNavigation(content);
        bindHomeEvents();
        setupAdminTriggers();

    } catch (err) {
        console.error("FATAL BOOT ERROR:", err);
        showToast("App started in preview mode.", "warning");
    } finally {
        // ALWAYS EXECUTE: Guarantee splash removal regardless of errors above
        if (splash) splash.style.display = 'none';
        if (header) header.style.display = 'flex';
        if (content) content.style.display = 'block';
        if (nav) nav.style.display = 'flex';
    }
});

function setupNavigation(content) {
    const navHome = document.getElementById('nav-home');
    const navTasks = document.getElementById('nav-tasks');

    navHome?.addEventListener('click', () => {
        triggerHaptic('light');
        navHome.classList.add('active');
        navTasks?.classList.remove('active');
        if (content) renderHomeView(content);
        bindHomeEvents();
    });

    navTasks?.addEventListener('click', () => {
        triggerHaptic('light');
        navTasks.classList.add('active');
        navHome?.classList.remove('active');
        if (content) renderTasksView(content);
    });
}

function bindHomeEvents() {
    const adsgram = initAdsgram();
    const adeasly = initAdeasly();

    document.getElementById('quick-watch-btn')?.addEventListener('click', async () => {
        triggerHaptic('medium');
        const adsgramSuccess = await adsgram.showAd();
        if (!adsgramSuccess) {
            await adeasly.showAd();
        }
    });

    document.getElementById('quick-daily-btn')?.addEventListener('click', () => {
        triggerHaptic('medium');
        openDailyBonusModal();
    });

    document.getElementById('quick-refer-btn')?.addEventListener('click', () => {
        triggerHaptic('medium');
        openReferralModal();
    });

    document.getElementById('coin-balance')?.parentElement?.addEventListener('click', () => {
        triggerHaptic('medium');
        openRedeemModal();
    });
}
