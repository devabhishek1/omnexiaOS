# Phase 12 — Mistral AI Integration
**MILESTONE PHASE** — pause and await CONTINUE after completion.

## Your Job
Wire up all AI features using Mistral AI as the primary provider.
Gemini 2.5 Pro remains available as a dormant fallback but is not used in production.

## Why Mistral
- EU-native company (Paris), GDPR compliant by default
- Servers in Europe — client email data stays in EU
- Superior French and European language understanding
- Cheaper: ~€0.001-0.003 per request vs Gemini
- Mistral Small handles 90% of tasks. Mistral Large for complex cases.

## Context
Read `_docs/04-api-backend.md` section 4 before starting (Gemini patterns apply to Mistral with minor changes).

## Step 0 — Version Check
```bash
npm info @mistralai/mistralai version
```
Search web: "Mistral AI API Node.js SDK latest 2026 mistral-small mistral-large model names"
Get the correct current model identifiers before implementing.

## Step 1 — Install Mistral SDK
```bash
npm install @mistralai/mistralai
```
Add to .env.local:
```
MISTRAL_API_KEY=your_key_here
```
Get API key from: console.mistral.ai

## Step 2 — Mistral Client (`lib/mistral/client.ts`)
```typescript
import Mistral from '@mistralai/mistralai'

// Search web for correct SDK initialisation pattern for latest version
export const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! })

// Helper for chat completions
export async function mistralChat(params: {
  model: 'mistral-small-latest' | 'mistral-large-latest' // verify model names from web search
  messages: Array<{ role: 'user' | 'assistant' | 'system', content: string }>
  temperature?: number
  maxTokens?: number
}): Promise<string> {
  const response = await mistral.chat.complete({
    model: params.model,
    messages: params.messages,
    temperature: params.temperature ?? 0.3,
    maxTokens: params.maxTokens ?? 1000,
  })
  return response.choices[0].message.content as string
}
```

## Step 3 — Client Profile System (`lib/mistral/clientProfile.ts`)
This is the critical context document fed to every AI prompt.
Collected during onboarding and stored in businesses table (add columns if needed).

```typescript
export async function getClientProfile(businessId: string): Promise<string> {
  const { data } = await adminSupabase
    .from('businesses')
    .select('name, industry, country_code, locale, ai_context')
    .eq('id', businessId)
    .single()

  return `
Business name: ${data.name}
Industry: ${data.industry}
Country: ${data.country_code}
Language: ${data.locale}
Additional context: ${data.ai_context || 'None provided'}
  `.trim()
}
```

Add `ai_context` TEXT column to businesses table:
```sql
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ai_context TEXT;
```

This column stores: business hours, services offered, pricing, FAQ, preferred tone.
It's set during onboarding step 2 (business setup) — add an "AI Context" textarea there.

## Step 4 — Daily Digest (`lib/mistral/digest.ts`)
```typescript
export async function generateDigest(messages: Message[], locale: string, businessId: string): Promise<string> {
  const profile = await getClientProfile(businessId)
  const langMap: Record<string, string> = {
    fr: 'French', en: 'English', de: 'German', es: 'Spanish', it: 'Italian', nl: 'Dutch'
  }
  const language = langMap[locale] || 'French'

  const prompt = `You are an AI assistant for a European SMB.
Write a daily digest in ${language} for the business owner.
Keep it to 4-6 sentences. Be direct and actionable.
Highlight: urgent messages, overdue payments, complaints, time-sensitive requests.

Business context:
${profile}

Messages from the last 24 hours:
${messages.map(m => `- [${m.channel}] From: ${m.sender_name} | Subject: ${m.subject} | Preview: ${m.body_preview}`).join('\n')}

Format: total count → key highlights → 1-2 recommended actions.`

  return mistralChat({
    model: 'mistral-small-latest',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  })
}
```

## Step 5 — Reply Draft (`lib/mistral/reply.ts`)
```typescript
export async function generateReplyDraft(params: {
  thread: Message[]
  businessId: string
  locale: string
}): Promise<string> {
  const profile = await getClientProfile(params.businessId)

  const threadText = params.thread
    .map(m => `[${m.direction === 'inbound' ? 'Client' : 'Us'}]: ${m.body_cached}`)
    .join('\n\n---\n\n')

  const prompt = `You are an AI assistant managing business communications.
Write a professional reply to this conversation.
Match the language of the client's last message.
Match their formality level. Be warm but professional.
Write ONLY the reply body — no subject line, no greeting name unless natural.

Business context:
${profile}

Conversation thread (most recent last):
${threadText}`

  return mistralChat({
    model: 'mistral-small-latest',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
  })
}
```

## Step 6 — Urgency Flagging (`lib/mistral/urgency.ts`)
```typescript
export async function flagUrgency(subject: string, preview: string): Promise<{ urgent: boolean; reason: string }> {
  const prompt = `Analyse this email and determine if it is urgent for a small business.
Respond ONLY with valid JSON: { "urgent": boolean, "reason": string }

Flag urgent if: complaint, legal threat, overdue payment demand, refund request, angry customer, time-sensitive deadline.
Do NOT flag: newsletters, general enquiries, promotional emails.

Subject: ${subject}
Preview: ${preview}`

  try {
    const response = await mistralChat({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      maxTokens: 100,
    })
    return JSON.parse(response.replace(/```json|```/g, '').trim())
  } catch {
    return { urgent: false, reason: 'parse_error' }
  }
}
```

## Step 7 — Key Info Extraction (`lib/mistral/extract.ts`)
```typescript
export async function extractKeyInfo(body: string): Promise<{
  amounts: string[]
  dates: string[]
  names: string[]
  action_items: string[]
}> {
  const prompt = `Extract structured information from this email.
Respond ONLY with valid JSON matching this exact shape:
{ "amounts": string[], "dates": string[], "names": string[], "action_items": string[] }

Email:
${body.slice(0, 3000)}`

  try {
    const response = await mistralChat({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    })
    return JSON.parse(response.replace(/```json|```/g, '').trim())
  } catch {
    return { amounts: [], dates: [], names: [], action_items: [] }
  }
}
```

## Step 8 — Invoice Follow-up Email (`lib/mistral/followup.ts`)
New AI job — generates payment reminder emails for overdue invoices:
```typescript
export async function generateFollowupEmail(params: {
  clientName: string
  amount: number
  currency: string
  daysOverdue: number
  businessId: string
  locale: string
}): Promise<{ subject: string; body: string }> {
  const profile = await getClientProfile(params.businessId)
  const langMap: Record<string, string> = { fr: 'French', en: 'English', de: 'German', es: 'Spanish', it: 'Italian', nl: 'Dutch' }

  const prompt = `Write a professional payment reminder email in ${langMap[params.locale] || 'French'}.
The email is from the business to a client with an overdue invoice.
Tone: firm but polite. Not aggressive. Professional.
Return JSON: { "subject": string, "body": string }

Business context: ${profile}
Client: ${params.clientName}
Amount: ${params.currency}${params.amount}
Days overdue: ${params.daysOverdue}`

  try {
    const response = await mistralChat({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    })
    return JSON.parse(response.replace(/```json|```/g, '').trim())
  } catch {
    return {
      subject: `Payment reminder — ${params.currency}${params.amount}`,
      body: `Dear ${params.clientName},\n\nThis is a reminder that your invoice of ${params.currency}${params.amount} is ${params.daysOverdue} days overdue.\n\nPlease arrange payment at your earliest convenience.\n\nBest regards`
    }
  }
}
```

## Step 9 — Morning Digest Edge Function (`supabase/functions/morning-digest/index.ts`)
Deno Edge Function. Runs at 7am per business timezone via pg_cron.
- Fetch messages from past 24h for each business
- Call generateDigest() via Mistral API
- Upsert to ai_digests table
- If email digest enabled: fire Resend email

## Step 10 — Wire Urgency Into Webhook
Update `app/api/gmail/webhook/route.ts` to call `flagUrgency()` on each new message.
If urgent: set conversation.priority = true, insert notification.

## Step 11 — Wire Reply Draft Into Thread View
Update `app/api/mistral/reply/route.ts`:
POST: { conversationId } → fetch thread → call generateReplyDraft() → return draft
ThreadView AI panel calls this endpoint when opening an unread conversation.
Show loading skeleton while generating. Regenerate button re-calls the endpoint.

## Step 12 — Wire Digest Into Overview
Update DigestCard component:
- Fetch latest digest from ai_digests for today
- If none: "Your daily digest will be ready at 7:00" 
- "Regenerate" button → POST to /api/mistral/digest → on-demand generation

## Step 13 — Wire Follow-up Into Finance
Update the "Follow up" button in InvoiceBoard:
- Call /api/mistral/followup with invoice details
- Pre-fill Communications compose modal with generated subject + body
- User reviews and sends

## Step 14 — Add AI Context to Onboarding
Add a step to onboarding or to Step 2 (Business):
- Textarea: "Tell the AI about your business"
- Placeholder: "Business hours: Mon-Fri 9am-6pm. Services: web design, branding. Prices: from €500. Preferred tone: professional and friendly."
- Saved to businesses.ai_context

## Step 15 — Verify
1. Reply draft generates in Communications thread view
2. Digest card shows AI content on /overview
3. Urgency flagging marks priority conversations
4. Follow-up email generates from Finance overdue card
5. All text outputs in correct language (test with FR locale)
6. `npm run build` + `npx tsc --noEmit` pass

## Completion
1. `git add .`
2. `git commit -m "feat: phase-12 complete — Mistral AI (digest, reply drafts, urgency, extraction, follow-up emails)"`

**✅ MILESTONE — output checkpoint message and wait for CONTINUE.**
