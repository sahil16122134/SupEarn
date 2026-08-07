/* ==========================================================================
   SupEarn — js/core/firebase-config.js
   Firebase app initialization. Every other module imports the shared
   `auth` and `db` instances from here instead of re-initializing Firebase.
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

/**
 * Replace these values with your own Firebase project's web app config
 * (Firebase Console → Project Settings → General → Your apps → SDK setup).
 * These identifiers are safe to expose client-side — access is enforced
 * entirely by Firestore Security Rules, not by keeping this object secret.
 */
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "supearn-app.firebaseapp.com",
  projectId: "supearn-app",
  storageBucket: "supearn-app.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Persistent local cache lets the wallet/tasks render instantly from cache
// on repeat opens while Firestore syncs fresh data in the background.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager({}),
  }),
});

export default app;
