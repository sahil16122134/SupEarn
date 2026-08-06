// Telegram WebApp Wrapper Module
export const tg = window.Telegram?.WebApp;

export function initTelegramApp() {
    if (!tg || !tg.initDataUnsafe?.user) {
        console.warn("Not running inside Telegram WebApp environment.");
        return { isTelegram: false, user: null };
    }

    tg.ready();
    tg.expand();
    tg.setHeaderColor('#0a0f1d');
    tg.setBackgroundColor('#0a0f1d');

    return {
        isTelegram: true,
        user: tg.initDataUnsafe.user,
        initData: tg.initData
    };
}

export function triggerHaptic(type = 'light') {
    if (tg?.HapticFeedback) {
        if (['light', 'medium', 'heavy', 'rigid', 'soft'].includes(type)) {
            tg.HapticFeedback.impactOccurred(type);
        } else if (['error', 'success', 'warning'].includes(type)) {
            tg.HapticFeedback.notificationOccurred(type);
        }
    }
}