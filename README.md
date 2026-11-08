# Harborline Bank

Harborline is a fictional USD banking simulator built with React, Express, and SQLite. Use practice usernames and passwords.

## Overview accounts

The Overview shows a **Your accounts** strip. Everyday Checking is the real, persisted account — its balance and activity are stored in SQLite and drive transfers, deposits, bill pay, and card purchases. Alongside it are two sample display accounts, **Harbor Savings** and the **Harborline Platinum Card**, generated deterministically per profile and clearly tagged "Sample." Selecting an account updates the balance card, cash flow chart, and recent activity. The sample accounts are illustrative only and do not move real or persisted funds. See `src/accounts.js`.

## Run locally

Install Node.js 24 or later, open a terminal in this folder, and run `npm ci`.

Start the Express backend in one terminal.

```sh
npm run backend
```

Start the React development server in a second terminal.

```sh
npm run dev
```

Open http://127.0.0.1:5173/. Vite forwards API requests to the backend on port 43824.

To serve the built React app and API together, stop the development backend, then run `npm run build` and `npm start`. Open http://127.0.0.1:43824/. On Windows, `Start-Harborline.cmd` starts the included build after dependencies are installed.

## Try two accounts

1. Choose **Create a demo account**. Enter a unique username and a practice password of 12–128 characters.
2. Choose **Add test funds**, enter `250.00`, and look for the deposit in recent activity.
3. Sign out, create a second account, and confirm its balance is $0.00 and its history is empty.
4. Restart the backend and sign back into the first account. Its balance and dated transaction will still be there.

The **Fill demo credentials** button opens Alex’s separate, preloaded walkthrough account. Newly created accounts begin at $0.00.

## Set up the owner dashboard

1. Start Harborline and open [Owner access](http://127.0.0.1:43824/admin). Sign in with your own practice profile or create one.
2. On Windows, double-click **Setup-Harborline-Admin.cmd** in this folder. From a terminal in this folder, the same action is `npm run owner:setup`.
3. Paste the one-time code into **Owner setup code** and choose **Activate owner access**. The code expires after 20 minutes. This profile opens the owner workspace whenever you sign in.

The owner can create customer profiles, set or adjust balances, review sample checks and scheduled bills, post batch payouts, and export recent audit history. Switch to **Customer view** to test your own customer dashboard. Other practice profiles have their own sign-in and separate activity. All operations use simulated USD.

## Where data is stored

The backend creates `data/harborline.sqlite` when it first runs. The database stores usernames, salted password hashes, sessions, balances in cents, and account activity. It is excluded from the source archive. Keep this file to retain your accounts and their activity between runs. Browser-only accounts and activity from earlier versions require fresh signup in this version.

Transfers, sample check deposits, scheduled bill payments, card purchases, owner adjustments, payouts, and statements use the same account ledger. Card lock status and owner access persist in the database. Alert display preferences are scoped to the current browser tab.
