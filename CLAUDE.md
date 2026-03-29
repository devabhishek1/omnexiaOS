# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Omnexia** is a Business OS for European SMBs (5–100 employees), consolidating communications, finance, HR scheduling, and team management into a single application. All specifications are documented in `_docs/` — read them before implementing any feature.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), Tailwind CSS v4, shadcn/ui, React Hook Form + Zod
- **Backend:** Supabase (Postgres + Auth + Realtime + Edge Functions + Storage), hosted in Frankfurt (EU/GDPR)
- **AI:** Gemini 2.5 Pro (all AI features — no other LLM)
- **Integrations:** Gmail API, Google Calendar API, Resend (transactional email)
- **Hosting:** Vercel (frontend) + Supabase (backend)
- **i18n:** next-intl, 6 languages (EN, FR, DE, ES, IT, NL)

## Commands

```bash
npm run dev        # Start Next.js dev server (localhost:3000)
npm run build      # Production build
npm run lint       # ESLint
npm run format     # Prettier
npm test           # Jest

supabase start     # Start local Supabase stack
supabase deploy    # Deploy Edge Functions
```

## Repository Structure

```
app/
  (auth)/           # Login, signup, password reset
  (onboarding)/     # 9-step wizard
  (dashboard)/      # Main app: overview, communications, finance, planning, team, settings
  api/              # Thin API routes (delegate to Supabase Edge Functions)
components/
  ui/               # shadcn/ui base components
  layout/           # Sidebar, Topbar, Notifications
  overview/ communications/ finance/ planning/ team/ settings/
lib/
  supabase/         # Client, server, middleware helpers
  gmail/            # OAuth, polling, send logic
  gemini/           # AI prompt clients
  resend/           # Email templates
  utils/            # Locale, VAT, dates, crypto
supabase/
  functions/        # Deno Edge Functions: poll-gmail, morning-digest, check-overdue, send-notification
  migrations/       # SQL migration files
  seed.sql          # Public holidays seed data
messages/           # i18n locale JSON files (6 languages)
middleware.ts       # Auth + locale routing
types/database.ts   # Supabase-generated types
_docs/              # Product, tech, design, and API specifications (locked v1)
```

## Architecture

### Multi-Tenancy
Every database table has a `business_id` column. Row Level Security (RLS) policies enforce tenant isolation at the database level — never bypass RLS. Role-based access control uses a `module_access` JSONB field per user.

### Auth & Routing (middleware.ts)
- `/login`, `/signup` → public, redirect if already authenticated
- `/onboarding` → requires auth, redirect if onboarding complete
- `/dashboard/*` → requires auth + completed onboarding

### Edge Functions (Deno, Supabase)
Four serverless functions on cron schedules:
- `poll-gmail` — every 5 min: fetch Gmail, flag urgency via Gemini, insert notifications
- `morning-digest` — 7am per-business timezone: AI daily summary via Gemini
- `check-overdue` — 9am UTC daily: flag overdue invoices
- `send-notification` — called by other functions: insert notification row → triggers Realtime push

### AI (Gemini 2.5 Pro)
Four AI jobs: morning digest, reply draft generation, urgency flagging, key info extraction from emails. All Gemini calls use locale-aware prompts (business language).

### Gmail Integration
- Gmail OAuth tokens encrypted at rest with AES-256-GCM (`ENCRYPTION_KEY` env var = 64 hex chars)
- Polling-based sync (no push webhooks) — 5 min delay acceptable for MVP
- Send replies via RFC 2822 format

### Realtime Notifications
Supabase Realtime websockets deliver live notifications to clients. The `notifications` table insert triggers the push — no custom websocket server needed.

## Design System

Defined in `_docs/03-design-system.md`. Key points:
- **Colors:** Cream (#F6F6F1) background, white (#FFF) surfaces, Blue (#2563EB) primary
- **Typography:** DM Sans, 13px base, strict sizing scale
- **Layout:** 220px fixed sidebar, 56px sticky topbar; desktop-first (1280px+), icon-only sidebar at 1024px
- **Motion:** 0.15s transitions only, no heavy animations
- **AI content:** Indigo (#6366F1) with "✦ AI" badge indicator
- **Radius:** 12px cards, 24px padding

## Required Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GEMINI_API_KEY=
RESEND_API_KEY=
ENCRYPTION_KEY=          # 64 hex chars: openssl rand -hex 32
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## V1 Scope Boundaries

**In scope:** Gmail sync, Finance (invoices + expenses + VAT), Planning (shifts + time-off), Team management, AI digest + reply drafts, 6-language i18n, EU VAT per-country.

**Out of scope (v1):** Instagram/Facebook DMs (schema placeholder exists, no UI), invoice PDF generation, Stripe, mobile app, public API.

## Build Protocol

### Package Versions — Non-Negotiable Rule
Before installing ANY package, run `npm info <package> version` in the terminal OR search the web for its latest stable version. Never assume version numbers from training data. Always install the latest stable release.

### Phase-Based Build
This project is built in sequential phases (phase-01 through phase-15). Each phase has its own prompt file in `_docs/phases/`. Complete one phase fully before starting the next.

### Verification Checklist (run after every phase)
Before declaring a phase complete:
1. `npm run build` passes with zero errors
2. `npm run lint` passes
3. Dev server starts (`npm run dev`) and the relevant UI is visible in browser
4. No TypeScript errors (`npx tsc --noEmit`)
5. Commit all changes to git with message: `feat: phase-XX complete — [description]`

### Checkpoint Protocol
After completing a phase that is marked as a MILESTONE, stop completely and output this exact message:
"✅ MILESTONE COMPLETE: [phase name]. Please review and type CONTINUE to proceed to the next phase."
Do not proceed until the user types CONTINUE.

### Error Handling
If a build error occurs:
1. Read the full error message carefully
2. Attempt a fix (max 3 attempts)
3. If still failing after 3 attempts, output: "🚨 BLOCKED: [describe the error]. Please advise."
4. Wait for user input before continuing

### Context Rule
Always read the relevant `_docs/` files before implementing any feature. Never build from memory alone.
