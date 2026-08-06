// Application State & Settings Manager
export const state = {
    user: null,
    currentTab: 'home',
    tasks: [],
    withdrawalMethods: [
        { id: 'upi', name: 'UPI Transfer', icon: '💸', minCoins: 1000, rate: 0.1 },
        { id: 'stars', name: 'Telegram Stars', icon: '⭐', minCoins: 500, rate: 0.05 },
        { id: 'crypto', name: 'USDT (TON Network)', icon: '💎', minCoins: 5000, rate: 0.5 }
    ]
};

export function updateUserCoins(amount) {
    if (state.user) {
        state.user.coins += amount;
    }
}