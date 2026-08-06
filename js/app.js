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

// Helper to forcibly hide elements regardless of CSS rules
function forceHide(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.classList.add('hidden');
        el.style.display = 'none';
    }
}

// Helper to forcibly show elements
function forceShow(elementId, displayType = 'block') {
    const el = document.getElementById(elementId);
    if (el) {
        el.classList.remove('hidden');
        el.style.display = displayType;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // FAIL-SAFE: Guarantee splash screen disappears after 3 seconds no matter what crashes
    const safetyTimeout = setTimeout(() => {
        console.warn("Safety trigger: Force-closing splash screen due to slow init.");
        forceHide('splash-screen');
        forceShow('app-content');
        forceShow('main-header');
        forceShow('bottom-nav', 'flex');
    }, 3000);

    try {
        const { user: tgUser } = initTelegramApp();
        state.user = await authenticateUser(tgUser);
        
        // Cancel safety timeout once auth completes
        clearTimeout(safetyTimeout);

        // Hide splash screen & reveal UI elements explicitly
        forceHide('splash-screen');
        forceShow('main-header');
        forceShow('app-content');
        forceShow('bottom-nav', 'flex');

        // Render User Info
        const nameElem = document.getElementById('user-display-name');
        const handleElem = document.getElementById('user-telegram-handle');
        if (nameElem) nameElem.innerText = state.user.firstName;
        if (handleElem) handleElem.innerText = `@${state.user.username}`;

        // Render Initial Screen
        const appContent = document.getElementById('app-content');
        if (appContent) {
            renderHomeView(appContent);
        }

        // Navigation Tab Listeners
        const navHome = document.getElementById('nav-home');
        const navTasks = document.getElementById('nav-tasks');

        navHome?.addEventListener('click', () => {
            triggerHaptic('light');
            navHome.classList.add('active');
            navTasks?.classList.remove('active');
            if (appContent) renderHomeView(appContent);
            bindHomeEvents();
        });

        navTasks?.addEventListener('click', () => {
            triggerHaptic('light');
            navTasks.classList.add('active');
            navHome?.classList.remove('active');
            if (appContent) renderTasksView(appContent);
        });

        bindHomeEvents();
        setupAdminTriggers();

    } catch (err) {
        console.error("Initialization Failed:", err);
        clearTimeout(safetyTimeout);
        forceHide('splash-screen');
        forceShow('app-content');
        showToast("Loaded in preview mode.", 'warning');
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
