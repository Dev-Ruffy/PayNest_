# PayNest

**The digital wallet built for schools.** PayNest replaces cash at the boarding-school tuck shop with
secure, PIN-protected student wallets, funded through Housemasters and the school Accountant, and
spent safely without anyone carrying cash.

This is a full-stack monorepo: a **Next.js 14 (App Router)** frontend and an **Express + TypeScript +
Prisma/PostgreSQL** backend, with six role-specific dashboards (Developer, School Admin, Accountant,
Housemaster, Student, Tuck Shop Seller).

---

## 1. What's in this repo

```
paynest/
├── backend/     Express + TypeScript API, Prisma schema, seed script, Jest tests
└── frontend/    Next.js 14 App Router site — landing page, auth flows, 6 dashboards
```

| Area                                                                  | Status                                                                |
| --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Database schema (Prisma)                                              | ✅ Complete — all entities, relations, indexes                        |
| Auth (school onboarding, 6 login types, refresh tokens)               | ✅ Complete                                                           |
| Developer dashboard (schools, approvals, transactions, logs, system)  | ✅ Complete                                                           |
| Admin dashboard (students, staff, approvals, audit log, settings)     | ✅ Complete                                                           |
| Accountant / Housemaster dashboards (create/credit students, history) | ✅ Complete                                                           |
| Seller dashboard (PIN-verified purchase, receipt, history)            | ✅ Complete                                                           |
| Student dashboard (wallet, transactions, profile)                     | ✅ Complete                                                           |
| Landing page (Hero/About/Features/How-it-works/FAQ)                   | ✅ Complete                                                           |
| Automated tests                                                       | ✅ Backend unit tests (Jest). Frontend verified via production build. |

**A note on verification:** this project was built and validated inside a sandboxed environment without
open internet access to `binaries.prisma.sh` or `fonts.googleapis.com`. That means:

- `npx prisma generate` could not download its query-engine binary here, so the Prisma-typed parts of
  the backend could only be checked with a type stub rather than the real generated client.
- The frontend's Google Fonts (`next/font/google`) couldn't be fetched at build time here.

Both of these **will resolve automatically** the moment you run this on a machine with normal internet
access — nothing in the code needs to change. Everything else (all TypeScript logic, all 15 frontend
routes, the full Express app, Jest tests) was compiled, type-checked, and in the frontend's case,
**fully production-built** during development to catch real bugs before hand-off.

---

## 2. Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14 (local install, Docker, or a hosted instance like Render/Railway/Supabase)
- An SMTP account for real email delivery (Gmail App Password, SendGrid, Mailgun, etc.) — optional for
  local dev; emails just get logged as failed sends if unset, everything else still works.

---

## 3. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

| Variable                                   | Description                                                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                             | PostgreSQL connection string                                                                    |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Long random strings — `openssl rand -base64 48`                                                 |
| `PIN_ENCRYPTION_KEY`                       | 32+ char secret used to AES-encrypt student PINs for Admin recovery — `openssl rand -base64 32` |
| `SMTP_*`                                   | Your email provider's SMTP credentials                                                          |
| `DEVELOPER_EMAIL` / `DEVELOPER_PASSCODE`   | Credentials for the Developer login (defaults to `developer@paynest.app` / `827589`)            |
| `DEVELOPER_NOTIFY_EMAIL`                   | Where new-school notification emails are sent                                                   |
| `CORS_ORIGINS`                             | Comma-separated list of allowed frontend origins                                                |

Then set up the database:

```bash
npx prisma generate      # generates the typed Prisma client
npx prisma migrate dev --name init   # creates tables from schema.prisma
npm run seed              # bootstraps the Developer account + a demo school
```

The seed script prints demo credentials, including:

- **Admin:** `admin.brightfield` / `Password123!`
- **Accountant:** `accountant.brightfield` / `Password123!`
- **Seller:** `seller.brightfield` / `Password123!`
- **Housemaster shared password:** `house-demo-2024`
- **Student:** admission `BF-0001`, PIN `1234`

Start the API:

```bash
npm run dev        # http://localhost:4000, auto-reloads on file changes
```

Run tests:

```bash
npm test            # Jest unit tests (bcrypt, code generation, ApiError)
npm run type-check   # tsc --noEmit, if you add this script, or: npx tsc --noEmit
```

---

## 4. Frontend setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Edit `.env.local`:

| Variable              | Description                                                   |
| --------------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API, e.g. `http://localhost:4000/api` |

Start the dev server:

```bash
npm run dev        # http://localhost:3000
```

Build for production:

```bash
npm run build
npm start
```

---

## 4a. Already had this running before? Apply the new migration

The data model changed since your last setup: student PINs are now optional (set at first
purchase instead of account creation), and school deletion is now a recoverable "move to trash"
instead of a permanent delete. If you already ran `migrate dev` once, run it again to pick up
these changes — from the `backend` folder:

```bash
npx prisma migrate dev --name student_pin_and_school_trash
```

This is safe to run on existing data — it only widens two columns to allow null and adds a new
nullable `deletedAt` column, nothing gets deleted or rewritten.

---

## 5. How the pieces fit together

- **Auth:** short-lived JWT access tokens are kept in memory on the client (never `localStorage`, to
  resist XSS token theft) and paired with a rotating, `httpOnly` refresh cookie. On page load, the
  frontend silently calls `/auth/refresh` to restore a session.
- **Roles:** `Developer`, `Admin`, `Accountant`, `Housemaster`, `Student`, `Seller` — every backend route
  is guarded by `requireAuth` + `requireRole`, and the frontend mirrors this with `<RequireRole>`.
- **Student PINs:** students no longer choose a PIN at account creation — Accountants and
  Housemasters create student records with no PIN at all. The PIN a student types into their
  _first_ tuck shop purchase becomes their permanent PIN for every purchase and login after that
  (`transaction.service.ts`'s `purchase()` handles this branching). Once set, it's hashed with
  bcrypt for authentication, and _separately_ AES-256-GCM encrypted so an Admin or Housemaster can
  recover it if a student forgets it — Accountants deliberately do not have this ability. Every
  PIN view is written to the audit log.
- **Money movement:** `transaction.service.ts` is the single source of truth for wallet credits and
  PIN-verified purchases — both run inside a Prisma `$transaction` so a wallet debit and its matching
  credit/ledger entry can never happen partially.
- **One Accountant / one Seller per school:** enforced server-side at registration time, and the
  frontend's "Join Existing School" flow checks `/schools/:id/staff-availability` to show Login instead
  of Sign Up once a slot is filled.
- **Deleting a school is recoverable:** the Developer's "delete school" moves it to a trash state
  (`School.deletedAt`) instead of removing anything — all its users, students and transactions stay
  fully intact and it can be restored with one click from the Developer dashboard's Trash tab. A
  separate, strongly-confirmed "delete forever" action (type the school's name to confirm) is the
  only way to actually destroy a school's data.

---

## 6. Deployment

### Backend → Render or Railway

1. Create a PostgreSQL instance (Render/Railway both offer managed Postgres).
2. Create a new Web Service pointing at `backend/`, build command `npm install && npm run build && npx prisma migrate deploy`, start command `npm start`.
3. Set all `.env` variables from the table above in the service's environment settings.

### Frontend → Vercel

1. Import the repo, set the root directory to `frontend/`.
2. Set `NEXT_PUBLIC_API_URL` to your deployed backend's URL (e.g. `https://paynest-api.onrender.com/api`).
3. Deploy — Vercel auto-detects Next.js.

### Post-deploy

- Update `CORS_ORIGINS` on the backend to include your production frontend URL.
- Update `COOKIE_DOMAIN` and set `COOKIE_SECURE=true` once served over HTTPS.

---

## 7. Known limitations / suggested next steps

- **Cloudinary** is wired into the environment config as "future-ready" but no upload endpoints exist
  yet — there's currently nothing that needs file storage (no profile photos, receipts are generated
  as data, not images).
- **Email sending** requires real SMTP credentials; without them, the app functions fully but emails
  are logged as failed rather than delivered.
- **Automated integration/e2e tests** (Supertest against a real database, Playwright for the frontend)
  aren't included — the Jest suite covers pure security-critical utilities. A real Postgres instance
  and Prisma's engine binary (unavailable in the sandbox this was built in) are needed to safely add
  DB-backed integration tests.
- **Pagination** is basic offset-based paging; fine at school scale, but would want cursor-based paging
  if a single school's transaction history grows very large.

---

## 8. License

Proprietary — built for internal school use. Adapt as needed for your own deployment.
