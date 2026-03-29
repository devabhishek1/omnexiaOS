# Omnexia — API Integration & Backend Logic Reference
**Version:** 1.0 | **Status:** Locked

---

## 1. External Services Summary

| Service | Purpose | Auth method | Free tier |
|---|---|---|---|
| Google OAuth 2.0 | Gmail + Calendar auth | OAuth 2.0 PKCE | Free |
| Gmail API | Read/send emails, mark read | Bearer token | Free (quota limits) |
| Google Calendar API | Sync calendar to Planning | Bearer token | Free |
| Gemini 2.5 Pro | AI digest, reply drafts, urgency, extraction | API key | Paid per token |
| Resend | Transactional emails | API key | 3,000 emails/mo free |
| Supabase | DB, auth, storage, realtime, edge functions | Service key | Free tier |

---

## 2. Google OAuth Setup (GCP — Starting From Zero)

### Step-by-step GCP setup (one-time)
1. Create project at console.cloud.google.com
2. Enable APIs: Gmail API, Google Calendar API, Google People API
3. OAuth consent screen: External, App name "Omnexia", Logo, Privacy policy URL, Support email
4. Scopes to request:
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/contacts.readonly`
5. Create OAuth 2.0 Client ID → Web application
6. Authorised redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://app.omnexia.eu/api/auth/callback/google` (prod)
7. Download client credentials → set as env vars

### Environment variables
```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=   # For frontend OAuth button
```

### OAuth flow in app
```typescript
// lib/gmail/auth.ts

export function getGoogleAuthUrl(userId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/contacts.readonly',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: userId,  // Pass userId to callback to link token to user
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// app/api/auth/callback/google/route.ts
// Receives code, exchanges for tokens, encrypts + stores in gmail_tokens
```

### Token refresh logic
```typescript
// lib/gmail/client.ts

export async function getValidAccessToken(userId: string): Promise<string> {
  const token = await supabase
    .from('gmail_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (new Date(token.expires_at) < new Date()) {
    // Refresh the token
    const refreshed = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: decrypt(token.refresh_token),
        grant_type: 'refresh_token',
      }),
    });
    const { access_token, expires_in } = await refreshed.json();
    // Update token in DB
    await supabase.from('gmail_tokens').update({
      access_token: encrypt(access_token),
      expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
    }).eq('user_id', userId);
    return access_token;
  }

  return decrypt(token.access_token);
}
```

---

## 3. Gmail API Integration

### Polling logic (Edge Function: `poll-gmail`)
```typescript
// supabase/functions/poll-gmail/index.ts

// Runs every 5 minutes via pg_cron:
// SELECT cron.schedule('poll-gmail', '*/5 * * * *', 'SELECT net.http_post(...)');

Deno.serve(async () => {
  // 1. Get all businesses with connected Gmail
  const { data: tokens } = await supabase
    .from('gmail_tokens')
    .select('*, users(business_id)');

  for (const token of tokens) {
    // 2. Get valid access token (refresh if needed)
    const accessToken = await getValidAccessToken(token.user_id);

    // 3. Fetch messages since last poll
    const lastPoll = token.last_polled_at || new Date(Date.now() - 5 * 60 * 1000);
    const query = `after:${Math.floor(new Date(lastPoll).getTime() / 1000)}`;

    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const { messages } = await listRes.json();

    if (!messages?.length) continue;

    // 4. Fetch full message for each
    for (const msg of messages) {
      const fullMsg = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const msgData = await fullMsg.json();

      // 5. Parse headers + body
      const parsed = parseGmailMessage(msgData);

      // 6. Upsert conversation + message
      await upsertConversation(parsed, token.users.business_id);

      // 7. Run Gemini urgency flagging
      const urgency = await flagUrgency(parsed.subject, parsed.bodyPreview);
      if (urgency.urgent) {
        await markConversationPriority(parsed.threadId, token.users.business_id);
        await createNotification(token.users.business_id, 'message', parsed);
      }
    }

    // 8. Update last_polled_at
    await supabase.from('gmail_tokens')
      .update({ last_polled_at: new Date().toISOString() })
      .eq('id', token.id);
  }
});
```

### Message parsing helper
```typescript
function parseGmailMessage(msg: any) {
  const headers = msg.payload.headers;
  const get = (name: string) => headers.find((h: any) => h.name === name)?.value;

  const body = extractBody(msg.payload); // Decode base64url body parts

  return {
    gmailMessageId: msg.id,
    threadId: msg.threadId,
    from: get('From'),
    to: get('To'),
    subject: get('Subject'),
    date: get('Date'),
    bodyPreview: body.slice(0, 200),
    bodyCached: body.slice(0, 5000), // Cache first 5000 chars
    isUnread: msg.labelIds?.includes('UNREAD'),
  };
}
```

### Sending a reply
```typescript
// lib/gmail/send.ts

export async function sendReply(params: {
  userId: string;
  threadId: string;
  to: string;
  subject: string;
  body: string;
}) {
  const accessToken = await getValidAccessToken(params.userId);

  // Construct RFC 2822 email
  const email = [
    `To: ${params.to}`,
    `Subject: Re: ${params.subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    params.body,
  ].join('\n');

  const encoded = btoa(email).replace(/\+/g, '-').replace(/\//g, '_');

  await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encoded,
        threadId: params.threadId,
      }),
    }
  );
}
```

---

## 4. Gemini 2.5 Pro Integration

### Client setup
```typescript
// lib/gemini/client.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
export const gemini = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
```

### Job 1: Morning Digest
```typescript
// lib/gemini/digest.ts

export async function generateDigest(messages: Message[], locale: string): Promise<string> {
  const langMap: Record<string, string> = {
    fr: 'French', en: 'English', de: 'German', es: 'Spanish', it: 'Italian', nl: 'Dutch'
  };

  const prompt = `
You are a business assistant summarising yesterday's communications for a small business owner.
Write a concise daily digest in ${langMap[locale] || 'English'}.
Keep it to 4-6 sentences maximum. Be direct and actionable.
Highlight: urgent items, overdue payments mentioned, complaints, time-sensitive requests.

Messages to summarise:
${messages.map(m => `- [${m.channel}] From: ${m.sender_name} | Subject: ${m.subject} | Preview: ${m.body_preview}`).join('\n')}

Format: Start with total count, then key highlights, then 1-2 recommended actions.
  `.trim();

  const result = await gemini.generateContent(prompt);
  return result.response.text();
}
```

### Job 2: Reply Draft
```typescript
// lib/gemini/reply.ts

export async function generateReplyDraft(params: {
  thread: Message[];
  businessName: string;
  locale: string;
}): Promise<string> {
  const prompt = `
You are a professional assistant for ${params.businessName}.
Write a reply to the following email thread. Match the language of the conversation.
Be professional but warm. Match the formality level of the sender.
Do not add a subject line. Write only the reply body.

Thread (most recent first):
${params.thread.map(m => `[${m.direction === 'inbound' ? 'Them' : 'Us'}]: ${m.body_cached}`).join('\n\n---\n\n')}
  `.trim();

  const result = await gemini.generateContent(prompt);
  return result.response.text();
}
```

### Job 3: Urgency Flagging
```typescript
// lib/gemini/urgency.ts

export async function flagUrgency(subject: string, preview: string): Promise<{ urgent: boolean; reason: string }> {
  const prompt = `
Analyse this email and determine if it is urgent for a small business.
Respond ONLY with valid JSON: { "urgent": boolean, "reason": string }

Flag as urgent if: complaint, legal threat, overdue payment, refund demand, time-sensitive deadline, angry customer language.
Do NOT flag as urgent: newsletters, general enquiries, spam indicators.

Subject: ${subject}
Preview: ${preview}
  `.trim();

  const result = await gemini.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}
```

### Job 4: Key Info Extraction
```typescript
// lib/gemini/extract.ts

export async function extractKeyInfo(body: string): Promise<{
  amounts: string[];
  dates: string[];
  names: string[];
  action_items: string[];
}> {
  const prompt = `
Extract structured information from this email body.
Respond ONLY with valid JSON matching this shape:
{ "amounts": string[], "dates": string[], "names": string[], "action_items": string[] }

Email body:
${body.slice(0, 3000)}
  `.trim();

  const result = await gemini.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}
```

---

## 5. Resend — Transactional Emails

### Client
```typescript
// lib/resend/client.ts
import { Resend } from 'resend';
export const resend = new Resend(process.env.RESEND_API_KEY);
```

### Email templates (sent as HTML)

**Team invite:**
```typescript
await resend.emails.send({
  from: 'Omnexia <noreply@omnexia.eu>',
  to: inviteeEmail,
  subject: `You've been invited to join ${businessName} on Omnexia`,
  html: inviteEmailTemplate({ businessName, inviteUrl, inviterName }),
});
```

**Invoice overdue:**
```typescript
await resend.emails.send({
  from: 'Omnexia <noreply@omnexia.eu>',
  to: adminEmail,
  subject: `Invoice overdue: ${clientName} — €${amount}`,
  html: overdueEmailTemplate({ clientName, amount, daysOverdue, invoiceId }),
});
```

**Time-off approved/rejected:**
```typescript
await resend.emails.send({
  from: 'Omnexia <noreply@omnexia.eu>',
  to: employeeEmail,
  subject: `Your time-off request has been ${status}`,
  html: timeOffResponseTemplate({ employeeName, startDate, endDate, status, reviewerName }),
});
```

**Daily digest (if email delivery enabled):**
```typescript
await resend.emails.send({
  from: 'Omnexia <digest@omnexia.eu>',
  to: adminEmail,
  subject: `Your Omnexia daily digest — ${formattedDate}`,
  html: digestEmailTemplate({ digestContent, date, businessName }),
});
```

---

## 6. Supabase Realtime — Live Notifications

### Client-side subscription
```typescript
// components/layout/NotificationProvider.tsx

useEffect(() => {
  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        // Add to local notification state
        addNotification(payload.new);
        // Show toast
        toast(payload.new.title);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [userId]);
```

---

## 7. Cron Job Schedule (pg_cron)

```sql
-- Run in Supabase SQL editor after deploying Edge Functions

-- Poll Gmail every 5 minutes
SELECT cron.schedule(
  'poll-gmail',
  '*/5 * * * *',
  $$SELECT net.http_post(url := 'https://<project-ref>.supabase.co/functions/v1/poll-gmail', headers := '{"Authorization": "Bearer <service-key>"}')$$
);

-- Morning digest at 7am UTC (businesses handle their own timezone in the function)
SELECT cron.schedule(
  'morning-digest',
  '0 7 * * *',
  $$SELECT net.http_post(url := 'https://<project-ref>.supabase.co/functions/v1/morning-digest', headers := '{"Authorization": "Bearer <service-key>"}')$$
);

-- Check overdue invoices daily at 9am UTC
SELECT cron.schedule(
  'check-overdue',
  '0 9 * * *',
  $$SELECT net.http_post(url := 'https://<project-ref>.supabase.co/functions/v1/check-overdue', headers := '{"Authorization": "Bearer <service-key>"}')$$
);
```

---

## 8. Token Encryption

Gmail tokens must be encrypted at rest. Use AES-256-GCM:

```typescript
// lib/utils/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, tagHex, dataHex] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
```

Add `ENCRYPTION_KEY` to env vars (generate with `openssl rand -hex 32`).

---

## 9. i18n Implementation

### next-intl setup
```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'fr', 'de', 'es', 'it', 'nl'],
  defaultLocale: 'en',
  localeDetection: true, // Uses Accept-Language header = browser language
});
```

### Locale file structure
```json
// messages/fr.json (example)
{
  "nav": {
    "overview": "Vue générale",
    "communications": "Communications",
    "finance": "Finance",
    "planning": "Planning",
    "team": "Équipe & Rôles",
    "settings": "Paramètres"
  },
  "overview": {
    "digest_title": "Résumé IA",
    "unread_messages": "Messages non lus",
    "pending_invoices": "Factures en attente"
  }
  // ... all strings
}
```

### VAT by country
```typescript
// lib/utils/vat.ts
export const VAT_RATES: Record<string, number> = {
  FR: 20, DE: 19, ES: 21, IT: 22, NL: 21,
  BE: 21, PT: 23, PL: 23, AT: 20, SE: 25,
};

export const VAT_NUMBER_PATTERNS: Record<string, RegExp> = {
  FR: /^FR[A-Z0-9]{2}\d{9}$/,
  DE: /^DE\d{9}$/,
  ES: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
  IT: /^IT\d{11}$/,
  NL: /^NL\d{9}B\d{2}$/,
};
```

---

## 10. Environment Variables — Full List

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=

# Gemini
GEMINI_API_KEY=

# Resend
RESEND_API_KEY=

# Encryption
ENCRYPTION_KEY=   # 64 hex chars (32 bytes), generate: openssl rand -hex 32

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change for prod
```
