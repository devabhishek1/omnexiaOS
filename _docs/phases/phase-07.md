# Phase 07 — Gmail API Integration (Real-time via Google Pub/Sub)
**MILESTONE PHASE** — pause and await CONTINUE after completion.

## Your Job
Wire up real Gmail data using Google Pub/Sub webhooks for real-time sync (not polling).
Replace mock data in Communications with live Gmail messages.

## Context
Read `_docs/04-api-backend.md` sections 2 and 3 before starting.
NOTE: Gmail OAuth token storage is already partially implemented from onboarding.
The admin client pattern for bypassing RLS already exists — check lib/supabase/ before implementing.
The ?gmail_connected=true redirect param is already wired in app/api/auth/callback/google/route.ts.

## Why Pub/Sub over polling
Polling every 5 minutes = delayed messages, wasted API quota, unnecessary backend load.
Google Pub/Sub = Gmail pushes to us the instant a message arrives. Free, instant, efficient.

## Architecture
```
Gmail receives email
  → Gmail notifies Google Pub/Sub topic
    → Pub/Sub pushes to our webhook endpoint
      → We fetch the new message via Gmail API
        → Store in Supabase messages table
          → Supabase Realtime pushes to browser
            → UI updates instantly
```

## Step 0 — Version Check
```bash
npm info googleapis version
```
Search web: "Google Pub/Sub Gmail push notifications setup 2026 latest"

## Step 1 — Google Cloud Pub/Sub Setup (one-time, manual)
Instructions to follow in Google Cloud Console:
1. Go to console.cloud.google.com → Pub/Sub
2. Create a topic: `gmail-notifications`
3. Create a push subscription pointing to:
   `https://your-domain.com/api/gmail/webhook` (use ngrok for local dev)
4. Grant Gmail permission to publish to the topic:
   Run: `gcloud pubsub topics add-iam-policy-binding gmail-notifications \
   --member="serviceAccount:gmail-api-push@system.gserviceaccount.com" \
   --role="roles/pubsub.publisher"`
5. Add to .env.local:
   GOOGLE_PUBSUB_TOPIC=projects/YOUR_PROJECT_ID/topics/gmail-notifications

Document these steps clearly in a README note — every connected Gmail account
needs to call `users.watch()` to register with Pub/Sub.

## Step 2 — Token Encryption Utility
Create `lib/utils/crypto.ts` — AES-256-GCM encryption from `_docs/04-api-backend.md` section 8.
`ENCRYPTION_KEY` must be 64 hex chars.

## Step 3 — Gmail OAuth Helper (`lib/gmail/auth.ts`)
`getGoogleAuthUrl()` with scopes: gmail.modify, calendar.readonly, contacts.readonly.
`getValidAccessToken()` — auto-refreshes expired tokens, updates gmail_tokens table.
Use admin Supabase client to bypass RLS when storing tokens.

## Step 4 — Gmail Watch Registration (`lib/gmail/watch.ts`)
After a user connects Gmail, register their inbox with Pub/Sub:
```typescript
export async function registerGmailWatch(userId: string) {
  const accessToken = await getValidAccessToken(userId)
  const response = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/watch',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topicName: process.env.GOOGLE_PUBSUB_TOPIC,
        labelIds: ['INBOX'],
      })
    }
  )
  const { historyId, expiration } = await response.json()
  // Store historyId in gmail_tokens — used to fetch only new messages
  await adminSupabase.from('gmail_tokens')
    .update({ history_id: historyId, watch_expiry: new Date(parseInt(expiration)) })
    .eq('user_id', userId)
}
```
Watch expires every 7 days — add a daily cron to renew watches expiring within 24h.

## Step 5 — Webhook Endpoint (`app/api/gmail/webhook/route.ts`)
This is the endpoint Pub/Sub calls when a new Gmail arrives:
```typescript
export async function POST(request: Request) {
  // 1. Verify the request is from Google Pub/Sub
  const body = await request.json()
  const data = JSON.parse(Buffer.from(body.message.data, 'base64').toString())
  const { emailAddress, historyId } = data

  // 2. Find the user by email
  const token = await adminSupabase.from('gmail_tokens')
    .select('*, users(business_id)')
    .eq('email', emailAddress)
    .single()

  // 3. Fetch new messages since last historyId
  const accessToken = await getValidAccessToken(token.user_id)
  const newMessages = await fetchMessagesSinceHistory(accessToken, token.history_id, historyId)

  // 4. For each new message: parse, upsert to DB, run urgency flagging
  for (const msg of newMessages) {
    const parsed = parseGmailMessage(msg)
    await upsertMessage(parsed, token.users.business_id)
    await flagUrgency(parsed, token.users.business_id) // Mistral AI — Phase 12
  }

  // 5. Update stored historyId
  await adminSupabase.from('gmail_tokens')
    .update({ history_id: historyId, last_synced_at: new Date() })
    .eq('user_id', token.user_id)

  return new Response('OK', { status: 200 })
}
```

## Step 6 — Gmail Message Parser (`lib/gmail/parse.ts`)
Parse Gmail API message format:
- Extract headers: From, To, Subject, Date, Message-ID, In-Reply-To
- Decode base64url body (text/plain and text/html parts)
- Extract sender name + email from From header
- Return structured object matching messages table schema

## Step 7 — Message Upsert (`lib/gmail/sync.ts`)
```typescript
export async function upsertMessage(parsed, businessId) {
  // Upsert conversation (by threadId)
  const { data: conversation } = await adminSupabase
    .from('conversations')
    .upsert({
      business_id: businessId,
      channel: 'gmail',
      external_id: parsed.threadId,
      participant_email: parsed.senderEmail,
      participant_name: parsed.senderName,
      subject: parsed.subject,
      status: 'unread',
      last_message_at: parsed.date,
    }, { onConflict: 'external_id' })
    .select().single()

  // Insert message
  await adminSupabase.from('messages').insert({
    business_id: businessId,
    conversation_id: conversation.id,
    channel: 'gmail',
    gmail_message_id: parsed.messageId,
    direction: 'inbound',
    sender_email: parsed.senderEmail,
    sender_name: parsed.senderName,
    subject: parsed.subject,
    body_preview: parsed.body.slice(0, 200),
    body_cached: parsed.body.slice(0, 5000),
    is_read: false,
    received_at: parsed.date,
  })
}
```

## Step 8 — Send Reply (`lib/gmail/send.ts`)
RFC 2822 format reply via Gmail API with correct threadId reference.
POST endpoint: `app/api/gmail/send/route.ts`
On success: insert outbound message to DB, update conversation status to 'replied'.

## Step 9 — Wire Communications Page to Real Data
Replace mock data in ConversationList and ThreadView:
- Query conversations table filtered by business_id
- Messages fetched when conversation selected (by conversation_id)
- Supabase Realtime subscription for new conversations + messages
- Unread count badge on sidebar nav updates live

## Step 10 — Wire AI Reply Draft
ThreadView "AI Draft" panel:
- On opening unread conversation → POST to `/api/mistral/reply` (stub for now, returns mock)
- This gets properly wired in Phase 12 when Mistral is integrated
- For now: show loading state then display a placeholder draft

## Step 11 — Initial Gmail Sync
When a user first connects Gmail (from onboarding or Settings):
1. Call `registerGmailWatch()` to subscribe to Pub/Sub
2. Fetch last 50 messages to seed the inbox immediately
3. Store in DB via `upsertMessage()`

## Step 12 — Local Development Setup
Pub/Sub requires a public HTTPS URL. For local dev:
```bash
# Install ngrok
npm install -g ngrok
ngrok http 3000
# Copy the https URL → add to Google Cloud Pub/Sub subscription
# Add to .env.local: NEXT_PUBLIC_APP_URL=https://xxx.ngrok.io
```
Document this in README.

## Step 13 — Verify
1. `npm run dev` + ngrok running
2. Send a test email to the connected Gmail account
3. Verify it appears in the inbox within seconds (not 5 minutes)
4. Verify message stored in Supabase messages table
5. Verify conversation appears in Communications page
6. `npm run build` + `npx tsc --noEmit` pass

## Completion
1. `git add .`
2. `git commit -m "feat: phase-07 complete — Gmail Pub/Sub real-time sync, send reply, live inbox"`

**✅ MILESTONE — output checkpoint message and wait for CONTINUE.**
