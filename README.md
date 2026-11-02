# IT Recruitment Assistant: SaaS platform

A multi-company SaaS for IT recruitment teams and agencies. Each customer company gets its own private workspace with team roles, plan limits and monthly billing. Recruiters turn job descriptions into structured requirements and sourcing strings, screen resumes with a transparent match score, prepare technical interviews and track candidates through the pipeline.

**Operating principle:** the AI assists; the recruiter makes every hiring decision.

## What's included

| Area | Details |
|---|---|
| Public website | Landing page, pricing, privacy policy and terms (templates) |
| Accounts | Email + password sign-up with email confirmation, log in, password reset |
| Workspaces | Each company gets an isolated workspace. One person can belong to several and switch between them |
| Team and roles | Invite by link. Roles: **Owner** (everything incl. billing), **Admin** (team + jobs), **Recruiter** (jobs, screening, candidates), **Viewer** (read-only) |
| Plans and limits | 14-day free trial, Starter and Growth plans with seat, active-job and monthly AI usage limits; usage meters in Settings |
| Billing | Razorpay Subscriptions (card, UPI AutoPay, e-mandate), checkout verification and signed webhooks |
| Jobs | AI JD analysis, Boolean strings, sourcing keywords, screening questions, technical question bank, full editor |
| Screening | PDF / DOCX / TXT upload or paste; skill-by-skill evidence; deterministic weighted score with breakdown; recruiters can correct any grade |
| Pipeline | Candidate table with stage filters, search, source filter, comparison view; evaluation page; notes; dashboard funnel and conversion ratios |
| Messages | Ten candidate email templates with an AI "tighten" option. Nothing is sent automatically |
| Privacy | Only the extracted screening profile is stored, never the resume. Demographic details are ignored and never scored |

## Tech stack

- **Next.js 14** (App Router, TypeScript, server actions) and **Tailwind CSS**
- **Supabase**: Postgres, authentication and Row Level Security for tenant isolation
- **Claude API** (Anthropic) for JD analysis, resume screening and question generation, called only from the server
- **Razorpay Subscriptions** for payments. Stripe is invite-only for new Indian businesses, so Razorpay is used
- **Vitest** for scoring tests and a Postgres test script for the security rules

## Project structure

```
src/
  app/
    (marketing)/        Landing, pricing, privacy, terms
    (auth)/             Log in, sign up, password reset
    onboarding/         Create a workspace after sign-up
    invite/[token]/     Accept a team invitation
    app/                Signed-in product (dashboard, jobs, candidates, messages, settings)
    api/ai/             Claude-backed endpoints (metered by plan)
    api/billing/        Razorpay subscribe / verify / cancel
    api/webhooks/       Razorpay webhook (signature-verified)
  lib/                  Scoring, prompts, plans, Supabase clients, Razorpay helpers
  components/           Shared UI
supabase/
  migrations/           Database schema + Row Level Security
  tests/                Tenant-isolation tests for the schema
prototype/              The original single-file version of the app
```

## Setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com). Pick the **Mumbai (ap-south-1)** region to keep data in India.
2. Open **SQL Editor**, paste the contents of `supabase/migrations/0001_init.sql` and run it.
3. **Authentication → URL Configuration**: set **Site URL** to your app URL and add `https://YOUR-DOMAIN/auth/callback` (and `http://localhost:3000/auth/callback` for local work) to **Redirect URLs**.
4. **Authentication → SMTP**: connect your own email provider before launch. Supabase's built-in email is rate-limited and meant for testing.
5. Copy the project URL, `anon` key and `service_role` key from **Project Settings → API**.

### 2. Claude API
Create a key at [console.anthropic.com](https://console.anthropic.com) and add billing credit. Each JD analysis or resume screen is one API call.

### 3. Razorpay
1. Create an account at [razorpay.com](https://razorpay.com) and complete KYC.
2. **Subscriptions → Plans**: create a monthly **Starter** and **Growth** plan with the prices you want. Copy their plan IDs.
3. **Account & Settings → API Keys**: generate a key ID and secret (use test mode first).
4. **Account & Settings → Webhooks**: add `https://YOUR-DOMAIN/api/webhooks/razorpay`, choose a secret, and select the `subscription.*` events.
5. If you change prices, also update `src/lib/plans.ts` so the pricing page matches.

### 4. Run locally
```bash
cp .env.example .env.local   # fill in every value
npm install
npm run dev                  # http://localhost:3000
```

### 5. Deploy (Vercel)
1. Import this GitHub repo at [vercel.com/new](https://vercel.com/new).
2. Add every variable from `.env.example` under **Settings → Environment Variables**, with `NEXT_PUBLIC_APP_URL` set to your production URL.
3. Deploy, then update the Supabase redirect URLs and the Razorpay webhook URL to the production domain.

AI routes ask for up to 60 seconds per request (`maxDuration`). Check your Vercel plan's function duration limit; if it's lower, long analyses may time out.

## Tests

```bash
npm test          # scoring model unit tests
npm run typecheck
DATABASE_URL=postgres://... npm run test:db   # schema security tests: EMPTY throwaway database only
```

The database tests check that tenants can't read or write each other's data, viewers can't edit, invitations only work for the invited email, members can't change their own billing or usage, and a workspace always keeps an owner.

## Before launch

- Have the privacy policy and terms reviewed for India's **Digital Personal Data Protection Act, 2023**, and replace every `[Organization name]`, `[date]` and contact placeholder.
- Set real prices and limits in `src/lib/plans.ts` and matching Razorpay plans.
- Configure custom SMTP in Supabase so confirmation and reset emails are delivered reliably.
- Test a full Razorpay subscription in test mode, including a failed payment and a cancellation.
- GST invoicing is not built in. Use Razorpay's invoices or your accounting tool.

## Match score model

| Parameter | Weight |
|---|---:|
| Mandatory technical skills | 40 |
| Relevant experience | 25 |
| Project / domain experience | 15 |
| Preferred technical skills | 10 |
| Education / certifications | 5 |
| Role and location requirements | 5 |

Hands-on evidence earns full marks, listed-only or related technology half, not evidenced zero. Unstated details score half or zero and are flagged for verification. Bands: 85+ strong, 70–84 good, 55–69 partial, below 55 low. The score is a preliminary JD alignment measure, not a prediction of performance or a hiring decision.
