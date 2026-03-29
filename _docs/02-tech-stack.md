# Omnexia — Tech Stack & Architecture
**Version:** 1.0 | **Status:** Locked

---

## 1. Stack Overview

| Layer | Technology | Rationale |
|---|---|---|
| Frontend framework | Next.js 15 (App Router) | SSR, API routes, single repo, React |
| Styling | Tailwind CSS v4 | Utility-first, fast iteration |
| Component library | shadcn/ui | Unstyled, composable, owned code |
| Database | Supabase Postgres (Frankfurt, EU) | GDPR residency, relational, RLS built-in |
| Auth | Supabase Auth | JWT, OAuth, refresh rotation |
| Backend logic | Supabase Edge Functions (Deno) | Co-located with DB, free tier, no cold starts |
| Cron jobs | Supabase pg_cron | Native Postgres scheduler |
| Realtime | Supabase Realtime (websockets) | Live notifications, inbox updates |
| File storage | Supabase Storage | Logos, expense receipts |
| AI | Gemini 2.5 Pro (Google AI SDK) | All AI tasks |
| Email sending | Resend | Transactional emails, generous free tier |
| Gmail sync | Gmail API + Google OAuth 2.0 | Core integration |
| Calendar sync | Google Calendar API | Planning module |
| i18n | next-intl | 6 locale files, browser detection |
| Frontend hosting | Vercel | Zero-config Next.js, free tier |
| Drag and drop | @dnd-kit/core | Kanban + schedule grid |
| Charts | Recharts | Finance module charts |
| Form handling | React Hook Form + Zod | Validation, type-safe |
| Date handling | date-fns | Locale-aware formatting |

---

## 2. Repository Structure

```
omnexia/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group (no sidebar)
│   │   ├── login/
│   │   ├── signup/
│   │   └── reset-password/
│   ├── (onboarding)/             # Onboarding group (no sidebar)
│   │   └── onboarding/
│   │       ├── page.tsx          # Wizard controller
│   │       └── steps/            # Step components 1–9
│   ├── (dashboard)/              # Dashboard group (with sidebar)
│   │   ├── layout.tsx            # Sidebar + topbar layout
│   │   ├── overview/
│   │   ├── communications/
│   │   │   └── [id]/             # Individual conversation
│   │   ├── finance/
│   │   ├── planning/
│   │   ├── team/
│   │   │   └── [employeeId]/     # Employee profile
│   │   └── settings/
│   └── api/                      # Next.js API routes (thin, delegates to Edge Functions)
│       ├── auth/
│       ├── gmail/
│       └── webhooks/
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── layout/                   # Sidebar, Topbar, NotificationPanel
│   ├── overview/                 # DigestCard, StatCard, QuickActions, etc.
│   ├── communications/           # ConversationList, ThreadView, AIReplyPanel, etc.
│   ├── finance/                  # KPIBar, InvoiceBoard, ExpenseTable, Charts, etc.
│   ├── planning/                 # ScheduleGrid, CalendarView, TimeOffPanel, etc.
│   ├── team/                     # EmployeeTable, EmployeeProfile, ActivityLog, etc.
│   └── settings/                 # SettingsTabs, IntegrationCard, etc.
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   ├── server.ts             # Server Supabase client
│   │   └── middleware.ts         # Auth middleware
│   ├── gmail/
│   │   ├── client.ts             # Gmail API wrapper
│   │   ├── poll.ts               # Polling logic
│   │   └── send.ts               # Send email logic
│   ├── gemini/
│   │   ├── client.ts             # Gemini API wrapper
│   │   ├── digest.ts             # Daily digest prompt
│   │   ├── reply.ts              # Reply draft prompt
│   │   ├── urgency.ts            # Urgency flagging prompt
│   │   └── extract.ts            # Key info extraction prompt
│   ├── resend/
│   │   └── client.ts             # Email sending wrapper
│   └── utils/
│       ├── locale.ts             # Locale detection + formatting
│       ├── vat.ts                # VAT calculation per country
│       └── dates.ts              # date-fns locale helpers
├── supabase/
│   ├── functions/                # Edge Functions
│   │   ├── poll-gmail/           # Runs every 5 min
│   │   ├── morning-digest/       # Runs at 7am via pg_cron
│   │   ├── check-overdue/        # Runs daily, flags invoices
│   │   └── send-notification/    # Fires Resend emails
│   ├── migrations/               # SQL migration files
│   └── seed.sql                  # Public holidays seed data
├── messages/                     # next-intl locale files
│   ├── en.json
│   ├── fr.json
│   ├── de.json
│   ├── es.json
│   ├── it.json
│   └── nl.json
├── middleware.ts                  # Auth + locale routing
└── types/
    └── database.ts               # Generated Supabase types
```

---

## 3. Database Schema

### Multi-tenancy
Every table (except `public_holidays`) has a `business_id` column. Row Level Security policies enforce that users can only access rows where `business_id` matches their authenticated business.

### Tables

```sql
-- Core business entity
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  country_code CHAR(2) NOT NULL,         -- ISO 3166-1 alpha-2
  vat_number TEXT,
  industry TEXT,
  size_range TEXT,                        -- '1-10', '11-50', '51-100'
  locale TEXT NOT NULL DEFAULT 'en',     -- next-intl locale
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (linked to Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  business_id UUID REFERENCES businesses(id),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'employee',  -- 'admin' | 'manager' | 'employee' | 'accountant'
  module_access JSONB DEFAULT '{"communications": true, "finance": false, "planning": true, "team": false}',
  status TEXT DEFAULT 'active',           -- 'active' | 'on_leave' | 'deactivated'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gmail OAuth tokens (encrypted)
CREATE TABLE gmail_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id),
  email TEXT NOT NULL,                    -- connected Gmail address
  access_token TEXT NOT NULL,            -- encrypted at rest
  refresh_token TEXT NOT NULL,           -- encrypted at rest
  expires_at TIMESTAMPTZ NOT NULL,
  calendar_connected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations (thread containers)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  channel TEXT NOT NULL DEFAULT 'gmail', -- 'gmail' | 'instagram' | 'facebook'
  external_id TEXT,                       -- Gmail thread ID
  participant_email TEXT,
  participant_name TEXT,
  subject TEXT,
  status TEXT DEFAULT 'unread',          -- 'unread' | 'read' | 'replied' | 'pending'
  priority BOOLEAN DEFAULT FALSE,        -- AI-flagged urgent
  assigned_to UUID REFERENCES users(id),
  labels TEXT[] DEFAULT '{}',
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual messages within conversations
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  conversation_id UUID REFERENCES conversations(id),
  channel TEXT NOT NULL DEFAULT 'gmail',
  gmail_message_id TEXT,                 -- Gmail API message ID
  direction TEXT NOT NULL,               -- 'inbound' | 'outbound'
  sender_email TEXT,
  sender_name TEXT,
  subject TEXT,
  body_preview TEXT,                     -- First 200 chars
  body_cached TEXT,                      -- Full body (recent messages only)
  ai_summary TEXT,                       -- Gemini-extracted summary
  ai_extracted JSONB,                    -- Extracted entities (amounts, dates, names)
  is_read BOOLEAN DEFAULT FALSE,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI daily digests
CREATE TABLE ai_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  date DATE NOT NULL,
  content TEXT NOT NULL,                 -- Full digest text
  message_count INT,
  urgent_count INT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, date)
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  client_name TEXT NOT NULL,
  line_items JSONB NOT NULL,             -- [{description, quantity, unit_price}]
  subtotal DECIMAL(10,2),
  vat_rate DECIMAL(5,2),
  vat_amount DECIMAL(10,2),
  total DECIMAL(10,2),
  currency CHAR(3) DEFAULT 'EUR',
  status TEXT DEFAULT 'unpaid',          -- 'unpaid' | 'sent' | 'paid' | 'overdue'
  due_date DATE,
  issued_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) DEFAULT 'EUR',
  category TEXT,
  receipt_url TEXT,
  date DATE NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees (HR profile, separate from users auth record)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  user_id UUID REFERENCES users(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role_title TEXT,                       -- Display role (e.g. "Commercial", "Designer")
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shifts
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  employee_id UUID REFERENCES employees(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time-off requests
CREATE TABLE time_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  employee_id UUID REFERENCES employees(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',         -- 'pending' | 'approved' | 'rejected'
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL,                    -- 'message' | 'invoice_overdue' | 'time_off' | 'shift_conflict' | 'invite'
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,                             -- Route to navigate on click
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,                  -- e.g. 'invoice.created', 'shift.updated'
  target_type TEXT,                      -- 'invoice' | 'employee' | 'shift' etc.
  target_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public holidays (seeded, not per-business)
CREATE TABLE public_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code CHAR(2) NOT NULL,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  UNIQUE(country_code, date)
);

-- Social channel placeholders (schema ready for v1.5)
CREATE TABLE social_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  channel TEXT NOT NULL,                 -- 'instagram' | 'facebook'
  status TEXT DEFAULT 'not_connected',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Row Level Security Policies

Every table enforces business-scoped isolation:

```sql
-- Example RLS for invoices (repeated pattern for all tables)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_isolation" ON invoices
  FOR ALL USING (
    business_id = (
      SELECT business_id FROM users WHERE id = auth.uid()
    )
  );
```

Additional role-based policies for Finance (accountant + admin only), Team (admin + manager), etc. are defined per table.

---

## 5. Edge Functions

### `poll-gmail`
- **Trigger:** pg_cron every 5 minutes
- **Logic:** For each business with connected Gmail, fetch new messages since last poll timestamp. Insert into `messages` + `conversations`. Run Gemini urgency flagging on each new message. Insert in-app notification if priority flagged. Update `last_polled_at`.

### `morning-digest`
- **Trigger:** pg_cron at 7am per business timezone
- **Logic:** Fetch all messages from past 24h for business. Send to Gemini 2.5 Pro with digest prompt. Store result in `ai_digests`. If email digest enabled in settings, fire Resend email to admin(s).

### `check-overdue`
- **Trigger:** pg_cron daily at 9am UTC
- **Logic:** Query invoices where `due_date < NOW()` and `status != 'paid'`. Update status to `overdue`. Insert notification. Fire Resend email to admin.

### `send-notification`
- **Trigger:** Called by other Edge Functions
- **Logic:** Insert into `notifications` table (triggers Supabase Realtime to push to client). Optionally fire Resend email based on user notification preferences.

---

## 6. Gemini 2.5 Pro — Prompt Jobs

### Job 1: Morning Digest
```
Input: Array of messages from past 24h (sender, subject, preview, channel)
Output: 3–5 sentence summary in business locale language.
        Highlight: urgent items, pending invoices mentioned, staff-related flags.
```

### Job 2: Reply Draft
```
Input: Full conversation thread, business name, business locale
Output: A professional reply draft in the same language as the conversation.
        Tone: Friendly but professional. Match sender's formality level.
```

### Job 3: Urgency Flagging
```
Input: Single message (subject + body preview)
Output: JSON { urgent: boolean, reason: string }
        Flag if: complaint, overdue payment, urgent deadline, legal language.
```

### Job 4: Key Info Extraction
```
Input: Full email body
Output: JSON { amounts: [], dates: [], names: [], action_items: [] }
        Used to enrich ai_extracted column in messages table.
```

---

## 7. Gmail Integration Flow

### OAuth Connection (Onboarding Step 6)
1. User clicks "Connect Gmail"
2. Google OAuth consent screen (scopes: gmail.modify, calendar.readonly, contacts.readonly)
3. Callback stores `access_token` + `refresh_token` encrypted in `gmail_tokens`
4. First poll triggered immediately to seed inbox

### Polling Flow (every 5 min)
1. Edge Function fetches `gmail_tokens` for all businesses
2. For each token: refresh if expired → call Gmail API `messages.list` with `q: after:{last_poll_timestamp}`
3. For each new message: fetch full message → parse → upsert into `messages` + `conversations`
4. Run Gemini urgency job on each new message
5. Update `last_polled_at`

### Sending Replies
1. User edits AI draft (or writes manually) → clicks Send
2. Next.js API route → Gmail API `messages.send` with proper thread references
3. Insert outbound message into `messages` table
4. Update conversation `status` to `replied`

---

## 8. Auth Flow & Middleware

```
middleware.ts intercepts every request:
  /login, /signup → public, redirect to /overview if already authenticated
  /onboarding → requires auth, redirect to /overview if onboarding complete
  /overview, /communications, etc. → requires auth + completed onboarding
  
Role checks happen at component + API level:
  Finance pages → check module_access.finance === true
  Team pages → check role === 'admin' || 'manager'
  etc.
```

---

## 9. Hosting & Deployment

| Service | Config |
|---|---|
| Vercel | Connect GitHub repo, auto-deploy on push to main |
| Supabase | Frankfurt (eu-central-1) region, free tier |
| Environment variables | SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GEMINI_API_KEY, RESEND_API_KEY |

---

## 10. Package Versions (2026)

Antigravity agents must search for latest stable versions at build time. Reference packages:
- `next` → latest 15.x
- `@supabase/supabase-js` → latest 2.x
- `@supabase/ssr` → latest
- `next-intl` → latest 3.x
- `@google/generative-ai` → latest
- `googleapis` → latest
- `resend` → latest
- `react-hook-form` → latest 7.x
- `zod` → latest 3.x
- `@dnd-kit/core` + `@dnd-kit/sortable` → latest
- `recharts` → latest 2.x
- `date-fns` → latest 3.x
- `tailwindcss` → latest 4.x
- `shadcn/ui` → latest (use CLI `npx shadcn@latest init`)
