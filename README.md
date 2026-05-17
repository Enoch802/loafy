# 🍞 Loafy — Bakery Delivery Management PWA

A full-featured Progressive Web App for managing bakery deliveries, customer accounts, debts, and AI-powered insights.

---

## Features

- **Deliverer App** — search customers, record sales, work offline, sync when back online
- **Admin Panel** — password-protected, manage customers, view financials, AI insights
- **Offline First** — IndexedDB caching means deliverers keep working without internet
- **AI Insights** — Groq-powered debt alerts, buying behaviour analysis, top 20 customers
- **PWA** — installable on tablets, works like a native app

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Offline Storage | IndexedDB (via `idb`) |
| AI | Groq API (llama3-70b) |
| Hosting | Vercel |
| PWA | vite-plugin-pwa + Workbox |

---

## Setup Guide

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/loafy.git
cd loafy
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to **SQL Editor** and run the SQL in `supabase/schema.sql`
3. Enable **Email/Password** auth under Authentication → Providers

### 3. Environment Variables

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> ⚠️ Do NOT add GROQ_API_KEY to .env — add it only in Vercel dashboard (it's server-side only)

### 4. Run Locally

```bash
npm run dev
```

### 5. Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import your repo
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GROQ_API_KEY`
4. Deploy!

---

## First Time Setup

1. Open the app — you'll be taken to the **Setup page**
2. Enter your bakery name and create your admin password
3. Admin panel is at `/admin` — use your password to log in
4. Deliverers go to `/register` to create accounts

---

## Products & Prices

| Product | Price |
|---|---|
| Bread | ₦250 |
| Bread | ₦350 |
| Bread | ₦450 |
| Bread | ₦650 |
| Bread | ₦900 |
| Bread | ₦1,400 |
| Doughnut | ₦1,100 |

---

## Customer ID Format

Customers get auto-generated IDs in the format **CUS10001**, **CUS10002**, etc.

---

## Admin Panel

Access at `/admin` with your password. Features:
- Full customer management (create, edit, delete)
- Daily and date-range financial reports
- Per-deliverer breakdown
- AI insights (Groq)
- Notification center for new customers added by deliverers

---

## Offline Mode

When internet is unavailable:
- Deliverers can still **search customers** (cached locally)
- All **transactions are saved to IndexedDB**
- When internet returns, everything **auto-syncs to Supabase**
- A banner shows offline status at all times

---

## License

MIT
