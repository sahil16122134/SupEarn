// Firebase Initialization Module
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// TODO: Replace with your actual Firebase project configuration credentials
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "supearn-app.firebaseapp.com",
    projectId: "supearn-app",
    storageBucket: "supearn-app.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp };