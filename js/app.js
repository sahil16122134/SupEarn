// Main Application Controller Entrypoint
import { initTelegramApp, triggerHaptic } from './telegram.js';
import { authenticateUser } from './auth.js';
import { state } from './settings.js';
import { showToast } from './ui.js';
import { renderHomeView } from './home.js';
import { renderTasksView } from './tasks.js';
import { initAdsgram } from './watch.js';
import { openDailyBonusModal } from './daily.js';
import { openRedeemModal } from './redeem.js';
import { openReferralModal } from './referral.js';
import { setupAdminTriggers } from './admin.js';

document.addEventListener('DOMContentLoaded', async () => {
    const { isTelegram, user: tgUser } = initTelegramApp();

    if (!isTelegram && window.location.hostname !== 'localhost') {
        document.getElementById('telegram-fallback')?.classList.remove('hidden');
        document.getElementById('splash-screen')?.classList.add('hidden');
        return;
    }

    try {
        state.user = await authenticateUser(tgUser);
        
        // Hide splash screen & show main application UI
        document.getElementById('splash-screen')?.classList.add('hidden');
        document.getElementById('main-header')?.classList.remove('hidden');
        document.getElementById('app-content')?.classList.remove('hidden');
        document.getElementById('bottom-nav')?.classList.remove('hidden');

        // Render User Info Header
        document.getElementById('user-display-name').innerText = state.user.firstName;
        document.getElementById('user-telegram-handle').innerText = `@${state.user.username}`;

        // Initial Route Render
        const appContent = document.getElementById('app-content');
        renderHomeView(appContent);

        // Bind Navigation Tabs
        const navHome = document.getElementById('nav-home');
        const navTasks = document.getElementById('nav-tasks');

        navHome?.addEventListener('click', () => {
            triggerHaptic('light');
            navHome.classList.add('active');
            navTasks.classList.remove('active');
            renderHomeView(appContent);
            bindHomeEvents();
        });

        navTasks?.addEventListener('click', () => {
            triggerHaptic('light');
            navTasks.classList.add('active');
            navHome.classList.remove('active');
            renderTasksView(appContent);
        });

        bindHomeEvents();
        setupAdminTriggers();

    } catch (err) {
        console.error("Initialization Failed:", err);
        showToast("Error starting app. Please try again.", 'error');
    }
});

function bindHomeEvents() {
    const adsgram = initAdsgram();

    document.getElementById('quick-watch-btn')?.addEventListener('click', () => {
        triggerHaptic('medium');
        adsgram.showAd();
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