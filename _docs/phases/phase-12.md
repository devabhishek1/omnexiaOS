# Phase 12 — Gemini AI Integration
**MILESTONE PHASE** — pause and await CONTINUE after completion.

## Your Job
Wire up all 4 Gemini AI jobs: morning digest, reply drafts, urgency flagging, key info extraction.

## Context
Read `_docs/04-api-backend.md` sections 4 (Gemini) and 5 (Resend) before starting. All prompt patterns are documented there.

## Step 0 — Version Check
```bash
npm info @google/generative-ai version
```
Search web for "Gemini 2.5 Pro API model string 2026" to confirm the correct model identifier string.

## Step 1 — Gemini Client (`lib/gemini/client.ts`)
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
export const gemini = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })
```
Verify the model string is still correct by searching: "Gemini 2.5 Pro model ID latest"

## Step 2 — Digest Job (`lib/gemini/digest.ts`)
Implement `generateDigest()` from `_docs/04-api-backend.md` section 4 Job 1.
- Takes array of messages + locale
- Returns 4–6 sentence summary in the business's language
- Handles all 6 locales

## Step 3 — Reply Draft Job (`lib/gemini/reply.ts`)
Implement `generateReplyDraft()` from `_docs/04-api-backend.md` section 4 Job 2.
- Takes conversation thread + business name + locale
- Returns draft reply body in conversation's language
- Matches sender's formality level

## Step 4 — Urgency Flagging Job (`lib/gemini/urgency.ts`)
Implement `flagUrgency()` from `_docs/04-api-backend.md` section 4 Job 3.
- Returns `{ urgent: boolean, reason: string }`
- Strict JSON output — handle parse errors gracefully (default to `{ urgent: false }`)

## Step 5 — Key Info Extraction Job (`lib/gemini/extract.ts`)
Implement `extractKeyInfo()` from `_docs/04-api-backend.md` section 4 Job 4.
- Returns `{ amounts, dates, names, action_items }`
- Handle parse errors gracefully (default to empty arrays)

## Step 6 — Morning Digest Edge Function (`supabase/functions/morning-digest/index.ts`)
Implement from `_docs/04-api-backend.md` section 5 (Edge Functions).
- Runs at 7am per business timezone via pg_cron
- Fetches messages from past 24h
- Calls `generateDigest()`
- Upserts to `ai_digests` table (UNIQUE on business_id + date)
- If email digest enabled: calls send-notification function

## Step 7 — Wire Urgency Into Poll Function
Update `supabase/functions/poll-gmail/index.ts` to:
- Replace the stub urgency call with real `flagUrgency()` call
- Handle Gemini API errors gracefully (don't fail the whole poll)

## Step 8 — Wire Reply Draft Into Thread View
Update `components/communications/ThreadView.tsx`:
- Replace static mock draft with real API call
- New API route: `app/api/gemini/reply/route.ts`
- POST: takes `{ conversationId }` → fetches thread → calls `generateReplyDraft()` → returns draft
- Loading state while generating (skeleton in the AI reply panel)
- Regenerate button calls the same endpoint

## Step 9 — Wire Digest Into Overview
Update `components/overview/DigestCard.tsx`:
- Fetch latest digest from `ai_digests` table for today
- If no digest yet (before 7am): show "Digest will be ready at 7am"
- "Regenerate" button: POST to `app/api/gemini/digest/route.ts` → triggers on-demand generation

## Step 10 — Verify
1. `npm run build` passes
2. `npx tsc --noEmit` passes
3. Reply draft API route returns a response (test with curl or browser)
4. Digest generation works on-demand

## Completion
1. `git add .`
2. `git commit -m "feat: phase-12 complete — Gemini AI (morning digest, reply drafts, urgency flagging, extraction)"`

**✅ MILESTONE — output checkpoint message and wait for CONTINUE.**