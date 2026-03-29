# Phase 13 — Resend Emails + Supabase Realtime Notifications
**MILESTONE PHASE** — pause and await CONTINUE after completion.

## Your Job
Wire up all transactional emails via Resend and ensure Supabase Realtime delivers live in-app notifications.

## Context
Read `_docs/04-api-backend.md` sections 5 (Resend) and 6 (Realtime) before starting.
Read `_docs/01-product-spec.md` section 10 (Notification Centre) before starting.

## Step 0 — Version Check
```bash
npm info resend version
```

## Step 1 — Resend Client (`lib/resend/client.ts`)
```typescript
import { Resend } from 'resend'
export const resend = new Resend(process.env.RESEND_API_KEY)
```

## Step 2 — Email Templates (`lib/resend/templates/`)
Create HTML email templates for each notification type. Keep them simple — white background, Omnexia logo text at top, clear message, single CTA button.

`team-invite.ts` — "You've been invited to join [business] on Omnexia" + join link button
`invoice-overdue.ts` — "[Client] invoice of €[amount] is [X] days overdue" + view invoice link
`time-off-response.ts` — "Your time-off request has been [approved/rejected]" + date range
`digest-email.ts` — Daily digest email wrapping the digest text content

All templates: accept typed params, return HTML string.

## Step 3 — Send Notification Edge Function (`supabase/functions/send-notification/index.ts`)
Called by other edge functions. Takes:
```typescript
{
  businessId: string
  userId: string
  type: 'message' | 'invoice_overdue' | 'time_off' | 'shift_conflict' | 'invite'
  title: string
  body: string
  link: string
  sendEmail?: boolean
  emailTo?: string
  emailTemplate?: string
  emailParams?: object
}
```
- Always: INSERT into `notifications` table (triggers Realtime push)
- If `sendEmail`: fire Resend with appropriate template

## Step 4 — Wire Up All Email Triggers
Update these existing functions/routes to call `send-notification`:

1. **Team invite** (`components/team/InviteModal.tsx` → `/api/team/invite`): fire invite email
2. **Invoice overdue** (`supabase/functions/check-overdue`): fire overdue email to admin
3. **Time-off approved/rejected** (`components/planning/TimeOffPanel.tsx` → `/api/planning/time-off`): fire response email to employee
4. **Morning digest** (if email delivery enabled in Settings): fire digest email

## Step 5 — Realtime Client Subscription
Update `components/layout/NotificationPanel.tsx`:
- Add Supabase Realtime subscription (exact pattern from `_docs/04-api-backend.md` section 6)
- New notification INSERT → add to local state + show toast (use `sonner` toast)
- Unread count badge on bell icon updates live
- "Mark all read" → batch update `is_read = true`

## Step 6 — Toast Notifications
Use `sonner` (already installed via shadcn).
Add `<Toaster />` to `app/(dashboard)/layout.tsx`.
Toast appears for:
- New message received: "New message from [sender]"
- Invoice overdue: "Invoice overdue: [client] €[amount]"
- Time-off request submitted: "New time-off request from [employee]"
- Shift conflict: "Shift conflict detected for [employee]"

## Step 7 — pg_cron Setup SQL
Create `supabase/migrations/002_cron_jobs.sql`:
```sql
-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Poll Gmail every 5 minutes
SELECT cron.schedule('poll-gmail', '*/5 * * * *',
  $$SELECT net.http_post(url := current_setting('app.supabase_url') || '/functions/v1/poll-gmail',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_key')))$$
);

-- Morning digest at 7am UTC
SELECT cron.schedule('morning-digest', '0 7 * * *',
  $$SELECT net.http_post(url := current_setting('app.supabase_url') || '/functions/v1/morning-digest',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_key')))$$
);

-- Check overdue invoices at 9am UTC
SELECT cron.schedule('check-overdue', '0 9 * * *',
  $$SELECT net.http_post(url := current_setting('app.supabase_url') || '/functions/v1/check-overdue',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_key')))$$
);
```

## Step 8 — Verify
1. `npm run dev`
2. Notification panel shows real notifications from DB
3. Realtime: insert a test notification directly in Supabase dashboard → it should appear live in the UI without refresh
4. `npm run build` passes

## Completion
1. `git add .`
2. `git commit -m "feat: phase-13 complete — Resend emails, Realtime notifications, cron job SQL, toast alerts"`

**✅ MILESTONE — output checkpoint message and wait for CONTINUE.**