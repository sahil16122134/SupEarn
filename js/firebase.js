import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "supearn-app.firebaseapp.com",
    projectId: "supearn-app",
    storageBucket: "supearn-app.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef123456"
};

let app = null;
let db = null;
let auth = null;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
} catch (e) {
    console.warn("Firebase failed to initialize. Running in offline mode.", e);
}

// Explicitly export auth alongside all required Firestore functions
export { app, db, auth, signInAnonymously, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp };
