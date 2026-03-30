> **NOTE:** Gmail OAuth token storage is already partially implemented.
> The onboarding flow stores tokens via Supabase admin client to bypass RLS.
> Check `lib/supabase/` for the admin client pattern before implementing
> `gmail_tokens` storage. The `?gmail_connected=true` redirect param is already
> wired in `app/api/auth/callback/google/route.ts`.

# Phase 07 — Gmail API Integration
**MILESTONE PHASE** — pause and await CONTINUE after completion.

## Your Job
Wire up real Gmail data. Replace mock data in Communications with live Gmail messages. Implement polling, OAuth token storage, and send reply.

## Context
Read `_docs/04-api-backend.md` sections 2 (Google OAuth Setup) and 3 (Gmail API) carefully. Every code pattern is documented there — follow it exactly.

## Step 0 — Version Check
```bash
npm info googleapis version
npm info @google/generative-ai version
```

## Step 1 — Token Encryption Utility
Create `lib/utils/crypto.ts` — exact implementation from `_docs/04-api-backend.md` section 8.
`ENCRYPTION_KEY` must be 64 hex chars. Add a comment: "Generate with: openssl rand -hex 32"

## Step 2 — Gmail OAuth Helper (`lib/gmail/auth.ts`)
Implement `getGoogleAuthUrl()` from `_docs/04-api-backend.md` section 2.
Scopes: `gmail.modify`, `calendar.readonly`, `contacts.readonly`.

## Step 3 — Gmail Token Refresh (`lib/gmail/client.ts`)
Implement `getValidAccessToken()` from `_docs/04-api-backend.md` section 2.
Auto-refreshes expired tokens and updates `gmail_tokens` table.

## Step 4 — Gmail Message Parsing (`lib/gmail/parse.ts`)
Implement `parseGmailMessage()` — extracts headers (From, To, Subject, Date), decodes base64url body.
Handle both `text/plain` and `text/html` parts.

## Step 5 — Poll Edge Function (`supabase/functions/poll-gmail/index.ts`)
Implement from `_docs/04-api-backend.md` section 3.
- Runs every 5 minutes (cron configured separately)
- Fetches new messages since `last_polled_at`
- Upserts into `messages` + `conversations` tables
- Calls urgency flagging (stub for now — returns `{ urgent: false }` until Gemini is wired in Phase 12)
- Creates notification if urgent
- Updates `last_polled_at`

## Step 6 — Send Reply (`lib/gmail/send.ts`)
Implement `sendReply()` from `_docs/04-api-backend.md` section 3.
RFC 2822 format, correct `threadId` reference.

## Step 7 — Reply API Route (`app/api/gmail/send/route.ts`)
POST endpoint:
- Validates user is authenticated
- Calls `sendReply()`
- Updates conversation status to 'replied'
- Returns `{ success: true }`

## Step 8 — Wire Communications Page to Real Data
Replace mock data in `ConversationList` and `ThreadView` with real Supabase queries:
- `conversations` table filtered by `business_id`
- Messages fetched when conversation selected
- Realtime subscription for new messages

## Step 9 — Connect Send Button
In `ThreadView`, the "Send Reply" button:
- POSTs to `/api/gmail/send`
- Shows loading state
- On success: adds outbound message to thread, clears AI draft
- On error: shows error toast

## Step 10 — Verify (requires real Gmail credentials in .env.local)
If credentials not yet set up, verify with mock data still in place and note in commit message.
1. `npm run build` passes
2. `npx tsc --noEmit` passes
3. Token encryption/decryption works (write a quick test in terminal)

## Completion
1. `git add .`
2. `git commit -m "feat: phase-07 complete — Gmail OAuth, polling Edge Function, send reply, real inbox data"`

**✅ MILESTONE — output checkpoint message and wait for CONTINUE.**