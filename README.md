# FixNear - Hyderabad Home Services Marketplace

Connects households in Hyderabad with verified electricians, AC repair technicians, and plumbers.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **Database**: MySQL 8 / MariaDB 10.4+ with Prisma ORM
- **Auth**: Auth.js (NextAuth v5), email + password
- **Styling**: Tailwind CSS + shadcn/ui
- **Validation**: Zod
- **Testing**: Vitest (unit) + Playwright (end-to-end)

## Getting Started

### Prerequisites

- Node.js 20+ (24 recommended)
- MySQL 8 or MariaDB 10.4+ on `localhost:3306` (XAMPP's MySQL works)

### Setup

1. Copy `.env.example` to `.env` and set your database login:

   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_DATABASE=home_services
   DB_USERNAME=naresh
   DB_PASSWORD=123456
   ```

   `DATABASE_URL` is built from these values. If the password contains `@ : / # ?`, write
   `DATABASE_URL` by hand with those characters URL-encoded.

   Generate an auth secret with `npx auth secret` and put it in `AUTH_SECRET`.

2. Install, create the database and tables, and load demo data:

   ```powershell
   npm install
   npx prisma migrate dev
   npm run db:seed
   ```

3. Start the app:

   ```powershell
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Demo accounts (password `password123`)

| Role | Email |
|---|---|
| Admin | admin@fixnear.in |
| Customer | customer@example.com |
| Technicians | ravi.electric@example.com, anil.ac@example.com, suresh.plumb@example.com |
| Pending technician | pending.tech@example.com |

`npm run db:seed` deletes all existing data first. It refuses to run when `NODE_ENV=production`.

## Booking workflow

```
REQUESTED --tech accepts--> ACCEPTED --tech quotes--> QUOTE_PENDING --customer accepts--> QUOTE_ACCEPTED
    |                          ^                          |
    |                          +---- customer rejects ----+
    +--tech declines--> REJECTED

QUOTE_ACCEPTED --tech starts--> IN_PROGRESS --tech finishes--> AWAITING_CUSTOMER_CONFIRMATION
               --customer confirms--> COMPLETED (customer can then review)

AWAITING_CUSTOMER_CONFIRMATION or COMPLETED --customer disputes--> DISPUTED
DISPUTED --admin settles--> COMPLETED   or   --admin refunds--> CANCELLED (payment marked REFUNDED)
```

- A technician can also quote straight from `REQUESTED`. A new quote replaces any quote still pending.
- Customers can cancel until work starts, and can pay once, after accepting a quote.
- Paying creates a commission record. Admins reconcile it on the Commission page.
- The allowed moves for each role live in `src/lib/booking-workflow.ts`. Every server action checks them.

Technicians appear in customer search only when an admin has approved them and they have enabled at least one service and one area on their profile.

## Features

**Customers:** search verified technicians, book a free one-hour slot within the technician's working hours, attach a photo of the problem, accept or reject itemised quotes, pay, confirm, review, dispute, cancel, and file complaints.

**Technicians:** set services, areas and weekly hours, upload ID and trade documents for verification, accept or decline requests, send quotes, run jobs, and track earnings and commission.

**Admins:** approve technicians after viewing their documents; suspend or reactivate users; add or disable services and areas; settle disputes; resolve complaints; hide abusive reviews; and reconcile commission. Every admin action is recorded in the audit log.

**Everyone:** a notification inbox (the bell icon) with email copies, and forgot/reset password by email link.

**Public pages:** `/technicians` lists approved technicians and links to a profile page for each, with metadata for search engines, `sitemap.xml` and `robots.txt`.

## Optional integrations

| What | Settings in `.env` | When left empty |
|---|---|---|
| Email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL` | Emails are written to `.mail-outbox.log` in the project folder |
| Online payments (Razorpay) | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Customers see a demo "Mark payment complete" button |

With Razorpay keys set, customers pay through Razorpay Checkout. The server creates the order and verifies the payment signature before marking the booking paid. Use test-mode keys first. Refunds after a dispute are recorded in the app; issue the actual refund from the Razorpay dashboard.

Uploaded photos and documents are stored in `UPLOAD_DIR` (default `./uploads`). They are served only to signed-in users allowed to see them. Back this folder up together with the database.

## Scripts

- `npm run dev` - development server
- `npm run build` / `npm run start` - production build and server
- `npm run lint` / `npm run typecheck`
- `npm run test` - unit tests
- `npm run test:e2e` - end-to-end tests (run `npm run build` first; uses port 3100 and the database in `.env`)
- `npm run db:migrate` - create/apply migrations
- `npm run db:seed` - reset demo data
- `npm run db:reset` - drop and recreate the database, then seed
- `npm run db:studio` - browse data in Prisma Studio

## Project Structure

```
src/
├── app/          # Pages (customer, technician, admin, auth)
├── components/   # UI components
├── hooks/        # Client hooks
├── lib/          # Server actions, workflow rules, prisma client, config
├── types/        # Type augmentation
└── test/         # Unit tests
e2e/              # Playwright end-to-end tests
prisma/           # Schema, migrations, seed
```
