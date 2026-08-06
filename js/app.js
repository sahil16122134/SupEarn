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
    const { isTelegram, user: tgUser } = initTelegramApp();

    try {
        state.user = await authenticateUser(tgUser);
        
        // Unhide core UI elements safely
        splash?.classList.add('hidden');
        document.getElementById('main-header')?.classList.remove('hidden');
        document.getElementById('app-content')?.classList.remove('hidden');
        document.getElementById('bottom-nav')?.classList.remove('hidden');

        // Render User Header Details
        const nameElem = document.getElementById('user-display-name');
        const handleElem = document.getElementById('user-telegram-handle');
        if (nameElem) nameElem.innerText = state.user.firstName;
        if (handleElem) handleElem.innerText = `@${state.user.username}`;

        // Render Home Screen
        const appContent = document.getElementById('app-content');
        renderHomeView(appContent);

        // Bind Nav Tabs
        const navHome = document.getElementById('nav-home');
        const navTasks = document.getElementById('nav-tasks');

        navHome?.addEventListener('click', () => {
            triggerHaptic('light');
            navHome.classList.add('active');
            navTasks?.classList.remove('active');
            renderHomeView(appContent);
            bindHomeEvents();
        });

        navTasks?.addEventListener('click', () => {
            triggerHaptic('light');
            navTasks.classList.add('active');
            navHome?.classList.remove('active');
            renderTasksView(appContent);
        });

        bindHomeEvents();
        setupAdminTriggers();

    } catch (err) {
        console.error("Initialization Failed:", err);
        if (splash) splash.classList.add('hidden');
        document.getElementById('app-content')?.classList.remove('hidden');
        showToast("Started in offline preview mode.", 'warning');
    }
});

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
