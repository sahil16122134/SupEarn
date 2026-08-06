// User Authentication & Firestore Sync Module
import { auth, db, doc, getDoc, setDoc, serverTimestamp } from './firebase.js';
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

export async function authenticateUser(tgUser) {
    try {
        await signInAnonymously(auth);
        const userId = tgUser ? `tg_${tgUser.id}` : 'dev_user_123';
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            const newUser = {
                uid: userId,
                telegramId: tgUser?.id || 123456,
                firstName: tgUser?.first_name || 'Guest',
                username: tgUser?.username || 'anonymous',
                coins: 100, // Welcome bonus
                referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                referredBy: null,
                dailyStreak: 0,
                lastStreakDate: null,
                createdAt: serverTimestamp()
            };
            await setDoc(userRef, newUser);
            return newUser;
        }

        return userSnap.data();
    } catch (err) {
        console.error("Auth error:", err);
        throw err;
    }
}