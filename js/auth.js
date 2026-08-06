import { auth, db, signInAnonymously, doc, getDoc, setDoc, serverTimestamp } from './firebase.js';

export async function authenticateUser(tgUser) {
    const defaultUser = {
        uid: tgUser ? `tg_${tgUser.id}` : 'dev_user_123',
        telegramId: tgUser?.id || 123456,
        firstName: tgUser?.first_name || 'Demo User',
        username: tgUser?.username || 'demouser',
        coins: 100,
        referralCode: 'SUP123',
        dailyStreak: 1
    };

    // Safe local fallback if API keys are unconfigured
    if (!auth || !db || auth?.app?.options?.apiKey === "YOUR_API_KEY") {
        console.warn("Using local storage user fallback.");
        const stored = localStorage.getItem('supearn_mock_user');
        if (stored) return JSON.parse(stored);
        
        localStorage.setItem('supearn_mock_user', JSON.stringify(defaultUser));
        return defaultUser;
    }

    try {
        await signInAnonymously(auth);
        const userRef = doc(db, 'users', defaultUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await setDoc(userRef, { ...defaultUser, createdAt: serverTimestamp() });
            return defaultUser;
        }

        return userSnap.data();
    } catch (err) {
        console.warn("Firebase Auth error, falling back to local mode:", err);
        return defaultUser;
    }
}
