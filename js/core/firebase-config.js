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
  apiKey: "AIzaSyBVcGaNWuKPwep8tcdC3M0f3ndFRHpoE0E",
  authDomain: "supearn-a4ce0.firebaseapp.com",
  projectId: "supearn-a4ce0",
  storageBucket: "supearn-a4ce0.firebasestorage.app",
  messagingSenderId: "527480346513",
  appId: "1:527480346513:web:eabd6df3e934b475652c30",
  measurementId: "G-7RQ8ESSLMC"
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
