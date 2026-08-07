# SupEarn — Firebase Setup Guide

This walks through everything needed to connect SupEarn to a real Firebase backend: creating the project, enabling Authentication, setting up Firestore, deploying security rules, seeding initial data, creating your first admin account, and hosting the site.

---

## 1. Create the Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. Name it (e.g. `supearn-app`). Google Analytics is optional — you can skip it.
3. Wait for provisioning to finish.

---

## 2. Register a Web App & Get Your Config

1. In the project overview, click the **`</>`** (Web) icon to add a web app.
2. Give it a nickname (e.g. "SupEarn Web"). You do **not** need Firebase Hosting checked here — we'll cover hosting separately in Step 8.
3. Firebase will show you a config object like this:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "supearn-app.firebaseapp.com",
  projectId: "supearn-app",
  storageBucket: "supearn-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

4. Open **`js/core/firebase-config.js`** in the project and replace the placeholder `firebaseConfig` object with your real values.

That's the only file that needs your Firebase credentials — everything else (`auth.js`, `firestore.js`, etc.) imports the shared `auth`/`db` instances from this file.

---

## 3. Enable Authentication

Go to **Build → Authentication → Sign-in method** and enable two providers:

| Provider | Used for |
|---|---|
| **Anonymous** | Every normal Telegram user — SupEarn signs them in anonymously and links that session to their Telegram ID |
| **Email/Password** | Admin accounts only — used for the hidden admin panel login |

Toggle both to **Enabled** and save.

---

## 4. Create the Firestore Database

1. Go to **Build → Firestore Database → Create database**.
2. Choose **Production mode** (we're supplying our own rules, not the wide-open test-mode rules).
3. Pick a location close to your users (this can't be changed later).

### Collections SupEarn uses

You don't need to manually create these — the app creates documents as needed — but here's the schema for reference:

**`users/{telegramId}`**
```
telegramId: string
username, displayName, firstName, lastName, profilePhoto, languageCode: string
firebaseUid: string          // anchors this doc to one Firebase Auth session
role: "user" | "admin"
coinBalance, totalEarnedCoins, totalRedeemedCoins: number
lastDailyLogin: string | null   // "YYYY-MM-DD"
dailyStreak: number
lastRewardedAdTime: Timestamp | null
pendingRedeemId: string | null
createdAt, updatedAt: Timestamp
```

**`settings/app`** — single document, see Step 5 below for exact fields.

**`redeemRequests/{autoId}`**
```
telegramId, username, profilePhoto: string
redeemType: "upi" | "giftcard"
amount: number
upiId: string           // if redeemType == "upi"
giftCardBrand, email: string   // if redeemType == "giftcard"
status: "pending"
createdAt: Timestamp
```

**`taskCompletions/{telegramId}_{taskId}`** — one doc per rewarded task, prevents double-crediting.

**`referrals/{telegramId}`**
```
telegramId, referrerId: string
tasksCompleted: number
bonusPaid: boolean
createdAt: Timestamp
```

---

## 5. Deploy Firestore Security Rules

The project includes `firestore.rules` — it enforces:
- Users can only ever read/write their **own** `users/{telegramId}` document (anchored via the `firebaseUid` field).
- Nobody can self-grant `role: "admin"` or edit their own wallet fields directly outside the app's transaction logic.
- `settings/app` is publicly readable but only writable by admins.
- Redeem requests can be created by any signed-in user for themselves, but only **deleted** (i.e. approved/rejected) by admins.
- Task completions are write-once — a task can never be rewarded twice for the same user.

### Option A — Firebase CLI (recommended)

```bash
npm install -g firebase-tools
firebase login
cd supearn
firebase use --add          # select your project when prompted
firebase deploy --only firestore:rules,firestore:indexes
```

This deploys both `firestore.rules` and the composite index in `firestore.indexes.json` (required for the admin panel's pending-requests query, which filters by `status` and orders by `createdAt`).

### Option B — Paste directly in the Console

Go to **Firestore Database → Rules**, paste the full contents of `firestore.rules`, and click **Publish**.

If you skip the CLI, you'll also need to create the composite index manually: **Firestore → Indexes → Composite → Add index** on collection `redeemRequests`, field `status` (Ascending) + `createdAt` (Descending). Alternatively, just run the app — Firestore will throw an error in the browser console with a direct link that creates the exact index needed.

---

## 6. Seed the Initial Settings Document

The app falls back to sensible defaults if `settings/app` doesn't exist yet, but you should create it so you (and future admins) can control reward rates without redeploying code.

In **Firestore Database → Data**, create a document at path `settings/app` with these fields:

| Field | Type | Example |
|---|---|---|
| `watchRewardCoins` | number | `10` |
| `dailyRewardCoins` | array\<number\> | `[10, 15, 20, 25, 30, 40, 60]` |
| `coinPerRupee` | number | `100` |
| `minimumUpiRedeem` | number | `1500` |
| `giftCardMinimums` | map | `{ amazon: 2000, flipkart: 2000, myntra: 2500 }` |
| `bannerAdId` | string | your TADS banner unit ID |
| `rewardedAdId` | string | your Monetag zone ID |
| `watchCooldownSeconds` | number | `15` |
| `popupCloseSeconds` | number | `5` |
| `referralBonusCoins` | number | `200` |
| `referralTasksRequired` | number | `4` |
| `adsgramBlockId` | string | your AdsGram Task block ID |
| `adeaslyApiKey` | string | your Adeasly API key |

Once this exists, all of these become editable live from the in-app **Admin Panel → Settings** tab — no redeploy needed to change reward rates.

---

## 7. Create Your First Admin Account

The admin panel requires a real Firebase Auth email/password account **plus** a matching Firestore document with `role: "admin"`. The security rules specifically check the document at `users/{your-auth-uid}` — so the document ID must equal your Firebase Auth UID (not your Telegram ID).

1. **Authentication → Users → Add user** — create the account with an email + password.
2. Copy the generated **User UID** shown in the users table.
3. **Firestore Database → Data → Start collection** (or add to existing `users` collection) → set the **Document ID** to that UID exactly → add fields:

```
firebaseUid: "<same UID>"
role: "admin"
username: "admin"
displayName: "Admin"
coinBalance: 0
totalEarnedCoins: 0
totalRedeemedCoins: 0
```

4. In the app, tap the SupEarn logo 5 times, then press and hold on the 6th tap (~2–3 seconds) to open the hidden admin login, and sign in with that email/password.

---

## 8. Hosting the Site

SupEarn is a static site (HTML/CSS/vanilla JS), so any static host works. Two easy options:

### Firebase Hosting (uses the included `firebase.json`)
```bash
firebase deploy --only hosting
```
Your app will be live at `https://<project-id>.web.app`.

### Any other static host
Upload the whole `supearn/` folder (minus `firestore.rules`, `firestore.indexes.json`, `firebase.json` — those are backend-only) to Netlify, Vercel, GitHub Pages, or your own server. No build step is required.

### Connecting it to your Telegram Bot
1. Talk to **@BotFather** → `/mybots` → select your bot → **Bot Settings → Menu Button** (or `/newapp` to register a Mini App).
2. Set the Web App URL to your hosted site's URL (must be HTTPS).
3. Update `TELEGRAM_BOT_USERNAME` in `js/core/telegram.js` to your bot's actual username (used for the outside-Telegram fallback link and referral deep links).

---

## 9. Quick Testing Checklist

- [ ] Open the Mini App from inside Telegram — splash screen should progress through its stages and land on Home with your real Telegram name/photo in the header.
- [ ] Open the site in a plain browser (not Telegram) — should show the "Open in Telegram" fallback screen.
- [ ] Watch & Earn credits coins and enforces the cooldown after a successful watch.
- [ ] Daily Login claims correctly and resets streak if you simulate a missed day (change `lastDailyLogin` manually in Firestore to test).
- [ ] Submit a Redeem request, then approve/reject it from the Admin Panel and confirm the coin balance updates accordingly.
- [ ] Toggle airplane mode — offline banner appears, Watch/Tasks/Redeem actions are blocked, and everything recovers automatically when reconnected.

---

## Files in this project related to Firebase

| File | Purpose |
|---|---|
| `js/core/firebase-config.js` | Your Firebase project credentials — edit this first |
| `js/core/auth.js` | Telegram → Firebase Auth bootstrap + admin login |
| `js/core/firestore.js` | Every Firestore read/write in the app funnels through here |
| `firestore.rules` | Security rules — deploy via CLI or paste in Console |
| `firestore.indexes.json` | Composite index required by the admin panel's request query |
| `firebase.json` | CLI deployment config for rules, indexes, and hosting |
