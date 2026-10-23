# Viciss-Ledger

> **Tagline:** Every Transaction. Every Balance. One Place.  
> **Browser Title:** Viciss-Ledger | Personal Money Tracker  
> **Stack:** Next.js 16 (App Router) • TypeScript • Tailwind CSS • Supabase PostgreSQL • Vitest • Progressive Web App (PWA)

---

## 1. Product Overview

**Viciss-Ledger** is a personal financial ledger web application engineered for financial clarity and precision. It replaces fragmented chat logs, mental calculations, and fragile spreadsheets with an accounting engine designed around a signed-balance convention.

- **Integer-Paise Precision:** All financial calculations operate on integer paise (1 Rupee = 100 paise) to prevent floating-point inaccuracies.
- **Indian Rupee Formatting:** Native Indian numbering system formatting (`₹1,25,000.00`).
- **Flexible Transaction Model:** Supports direct transfers (*I Gave Money*, *They Gave Me*), expenses with 4 financial treatments (*For Them*, *Personal Use*, *Shared*, *Reference Only*), repayments in either direction with excess handling, and adjustments with mandatory explanations.
- **Independent People Ledgers:** Every person has their own ledger (`/people/[personId]`) with breakdown metrics and chronological running balances.
- **Public Shared Ledgers:** Generates unguessable cryptographically secure tokens (`/share/[shareToken]`) allowing friends to view their verified read-only statements without logging in, with strict privacy safeguards protecting private contact information and other accounts.
- **Dual Persistence:** Operates immediately out-of-the-box with persistent server file storage (`.data/viciss_db.json`) and connects seamlessly to Supabase PostgreSQL when credentials are provided.
- **Progressive Web App (PWA):** Installable on mobile and desktop with offline fallback.

---

## 2. Project Architecture & Directory Structure

```
viciss-ledger/
├── .data/                                    # Local persistent file storage
│   └── viciss_db.json
├── public/                                   # Static assets & PWA files
│   ├── icon.svg                              # Brand icon (Stylized V with ledger motif)
│   ├── icon-192.png                          # PWA 192x192 icon
│   ├── icon-512.png                          # PWA 512x512 icon
│   ├── manifest.json                         # Web App Manifest
│   └── sw.js                                 # Service worker with offline fallback
├── src/
│   ├── app/
│   │   ├── api/                              # REST API Route Handlers
│   │   │   ├── backup/route.ts               # JSON Backup export & restore
│   │   │   ├── dashboard/route.ts            # Summary metrics & recent activity
│   │   │   ├── people/route.ts               # People listing & creation
│   │   │   ├── people/[personId]/route.ts    # Person GET, PATCH, DELETE
│   │   │   ├── people/[personId]/share/route.ts # Share toggle & token regeneration
│   │   │   ├── share/[shareToken]/route.ts   # Public read-only ledger data
│   │   │   ├── transactions/route.ts         # Transactions list & creation
│   │   │   └── transactions/[txId]/route.ts  # Transaction GET, PATCH, DELETE
│   │   ├── offline/page.tsx                  # Offline fallback page
│   │   ├── people/page.tsx                   # People directory & management
│   │   ├── people/[personId]/page.tsx        # Individual Ledger page with running balances
│   │   ├── settings/page.tsx                 # Settings, backup/restore, privacy
│   │   ├── share/[shareToken]/page.tsx       # Public read-only ledger page
│   │   ├── transactions/page.tsx             # Global Transactions page (search, filter, CSV)
│   │   ├── globals.css                       # Design tokens & Tailwind CSS
│   │   ├── layout.tsx                        # Root layout with metadata & PWA script
│   │   └── page.tsx                          # Main dashboard with 4 summary cards
│   ├── components/
│   │   ├── BrandLogo.tsx                     # Stylized V brand logo component
│   │   ├── DeleteConfirmModal.tsx            # Deletion confirmation modal
│   │   ├── Navigation.tsx                    # Desktop sidebar & mobile navigation
│   │   ├── PersonModal.tsx                   # Add/Edit person modal
│   │   ├── ServiceWorkerRegister.tsx         # PWA service worker registration
│   │   ├── ShareModal.tsx                    # Public sharing & token revocation modal
│   │   └── TransactionModal.tsx              # Dynamic transaction form with live preview
│   └── lib/
│       ├── accounting/                       # Core Accounting Engine
│       │   ├── __tests__/accounting.test.ts  # Vitest test suite (All 20 scenarios)
│       │   ├── currency.ts                   # INR formatting & integer paise conversion
│       │   ├── engine.ts                     # Invariants, balance effects & calculations
│       │   └── types.ts                      # Domain models & TypeScript interfaces
│       └── db/                               # Persistence Layer
│           ├── __tests__/db.test.ts          # Persistence & isolation unit tests
│           ├── index.ts                      # Unified data access & operations
│           └── storage.ts                    # Atomic file-backed database engine
├── supabase/
│   └── migrations/
│       └── 20261023_initial_schema.sql       # Supabase PostgreSQL schema & RLS policies
├── package.json                              # Scripts & dependencies
└── tsconfig.json                             # TypeScript configuration
```

---

## 3. Local Development

### Prerequisites
- Node.js (v20+ or v22 LTS)
- npm (v10+)

### Commands
```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite (All 24 tests across accounting & persistence)
npm test

# 3. Start local development server
npm run dev

# 4. Build for production
npm run build

# 5. Start production server
npm start
```

---

## 4. Environment Variables

Create a `.env.local` file in the root directory if connecting to a cloud Supabase instance:

```env
# Optional: Supabase PostgreSQL Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note on Zero-Config Local Development:** If `NEXT_PUBLIC_SUPABASE_URL` is omitted, Viciss-Ledger automatically activates its built-in persistent storage adapter in `.data/viciss_db.json`. All records are stored with full atomicity and persist across page refreshes, browser restarts, and device access.

---

## 5. Database Setup (Supabase PostgreSQL)

When deploying to Supabase:
1. Create a new project in the [Supabase Dashboard](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase project.
3. Open `supabase/migrations/20261023_initial_schema.sql` from this repository.
4. Run the SQL script. This creates:
   - `public.people` table with unique unguessable `share_token` generator.
   - `public.transactions` table with foreign keys and check constraints.
   - Row-Level Security (RLS) policies ensuring owners can only access their records.
   - Scoped public read policy permitting unauthenticated visitors to read shared records only when `is_sharing_enabled = true`.
   - Automated `updated_at` timestamp triggers.

---

## 6. How to Use Viciss-Ledger

### Adding a Person
1. Click **+ Add Person** from the dashboard or people directory.
2. Enter their Full Name (required) and optional Nickname.
3. Optionally add phone number, email, or private notes (these are strictly private and never exposed publicly).
4. Click **Create Person**.

### Recording a Transaction
1. Click **+ Record Transaction**.
2. Select the person and choose the transaction type:
   - **I Gave Money:** Directly increases what they owe you (+ balance effect).
   - **They Gave Me:** Decreases what they owe you (- balance effect).
   - **Expense:** Choose between:
     - *For this person:* Offsets funds they previously gave you or records an amount they owe you.
     - *Personal Use:* You used funds they gave you for yourself; creates a debt to them (- effect).
     - *Shared Expense:* Custom split where you specify your portion and their portion.
     - *Reference Only:* Records the expenditure with ₹0 balance effect.
   - **Repayment:** Specify direction (*They Repay Me* or *I Repay Them*). Excess repayments correctly cross zero without artificial limits.
   - **Adjustment:** Correct a ledger error with a mandatory explanation.
3. Check the **Live Balance Preview** box to see the exact resulting balance and status before saving.
4. Click **Save Transaction**.

### Sharing a Public Ledger
1. Open the person's ledger (`/people/[personId]`).
2. Click **Share Ledger** (or the share icon).
3. Toggle **Enable Public Read-Only Link** to ON.
4. Click **Copy** to copy the unguessable URL (`https://your-domain.com/share/[shareToken]`).
5. Send the link to the person. They can view their verified statement without creating an account.
6. To revoke access at any time, toggle sharing OFF or click **Regenerate Link**.

---

## 7. Progressive Web App (PWA) Installation

- **On Desktop (Chrome, Edge):** Click the install icon in the browser address bar or click *Install Viciss-Ledger* in browser settings.
- **On Mobile (Android / Chrome):** Tap the browser menu (three dots) and tap **Add to Home screen** or **Install App**.
- **On iOS (Safari):** Tap the **Share** button at the bottom and tap **Add to Home Screen**.

---

## 8. Automated Test Coverage

Run `npm test` to execute Vitest:

- **21 Accounting Engine Tests:** Cover all 20 scenarios specified in the specification (Money given, Money received, Multiple transfers, Repayments, Excess repayments, 4 Expense treatments, Shared split reconciliation, Reference-only transactions, Settled states, Transaction edits, Transaction deletes, Independent people ledgers, Deterministic running balances, and Indian Rupee formatting).
- **3 Persistence & Isolation Tests:** Verify person creation, transaction balance effect calculations, and strict public ledger data isolation (ensuring phone numbers, emails, private notes, and unshared records are completely excluded from public endpoints).
