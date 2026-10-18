# Bridge of Love — Trust Accounting & 80G Receipt Management System

Official accounting, daybook, and receipt management application designed specifically for **BRIDGE OF LOVE**, Tiruttani, Tamilnadu, built using the **PERN stack** (PostgreSQL 17, Express.js, React 19, Node.js v24).

---

## 🌟 Key Features

1. **Exact Receipt Format**:
   - Matches the official physical receipt template with dual maroon emblem logos, mottos, bilingual organization details, dark navy `DONOR DETAILS` and `DONATION DETAILS` banners, and green acknowledgment footer.
2. **One-Click All Accounts PDF**:
   - Single-click global export button that instantly compiles the entire ledger/daybook into an auditor-ready consolidated PDF statement with fund allocations, payment breakdowns, and trustee certification.
3. **Automated Free SMTP Email Delivery**:
   - Sends the generated bill/receipt PDF directly to the donor's email upon creation via standard SMTP at zero cost (e.g., standard free Gmail account with Google App Password).
4. **Manual WhatsApp Sharing**:
   - Dedicated 1-click WhatsApp button on each receipt row and preview modal with a courteous, pre-formatted acknowledgment message and receipt PDF download link.
5. **Real-Time Rupee Words Conversion**:
   - Instant conversion of numbers into formal Indian Rupee words (e.g., *₹15,000* → *Rupees Fifteen Thousand Only*).
6. **Bespoke Non-AI Design**:
   - Clean, executive Vanilla CSS styling tailored for trust governance with zero AI template clichés.

---

## 🚀 Quick Start Guide

### Option 1: Double-Click Launcher
Double-click [`start.bat`](file:///d:/recipt/start.bat) in this folder. It will start both the backend API and frontend dev server and automatically open [http://localhost:5173/](http://localhost:5173/) in your default browser.

### Option 2: Manual Terminal Launch
1. **Start Backend Server**:
   ```bash
   cd d:\recipt\server
   node index.js
   ```
   *Runs on `http://localhost:5000`*

2. **Start Frontend Client**:
   ```bash
   cd d:\recipt\client
   npm run dev -- --host
   ```
   *Runs on `http://localhost:5173`*

---

## 📧 Free SMTP Configuration (Gmail)

To enable automatic email delivery at zero cost:
1. Log in to your trust's Google Account at [myaccount.google.com](https://myaccount.google.com/).
2. Under **Security**, ensure **2-Step Verification** is turned ON.
3. In the search box, search for **App Passwords** (or go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
4. Create a new App Password named **"Bridge of Love Receipts"**.
5. Copy the 16-letter password shown on screen.
6. In the app, navigate to **Trust & SMTP Setup** in the sidebar.
7. Enter your Gmail in **SMTP Username** and paste the 16-letter code into **SMTP App Password**.
8. Click **"Test SMTP Connection"** to verify, then click **"Save All Settings"**.

---

## 🗄️ Database Architecture
- **PostgreSQL 17**: Running locally on port `5433`
- **Database Name**: `trust_account_db`
- **Tables**: `trust_settings`, `donors`, `account_heads`, `receipts`, `dispatch_logs`
"# Account_Management_BOL" 
