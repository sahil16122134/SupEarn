import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Placeholder config - Safe fallback included in auth module
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "supearn-app.firebaseapp.com",
    projectId: "supearn-app",
    storageBucket: "supearn-app.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef123456"
};

let db = null;
let auth = null;

try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
} catch (e) {
    console.warn("Firebase initialization skipped or misconfigured. Running in offline/mock mode.", e);
}

export { db, auth, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp };
