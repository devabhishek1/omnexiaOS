// supabase/functions/poll-gmail/index.ts
// Runs every 5 minutes via pg_cron. Fetches new Gmail messages and upserts them
// into the conversations + messages tables.
//
// Deploy: supabase functions deploy poll-gmail
// Cron:   SELECT cron.schedule('poll-gmail', '*/5 * * * *',
//           $$SELECT net.http_post(url := 'https://<ref>.supabase.co/functions/v1/poll-gmail',
//             headers := '{"Authorization": "Bearer <service-key>"}')$$);

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')!
const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!
const encryptionKey = Deno.env.get('ENCRYPTION_KEY')!

const supabase = createClient(supabaseUrl, serviceKey)

// ---------------------------------------------------------------------------
// Crypto (AES-256-GCM, Deno Web Crypto API)
// ---------------------------------------------------------------------------

async function importKey(hexKey: string): Promise<CryptoKey> {
  const raw = new Uint8Array(hexKey.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['decrypt'])
}

async function decrypt(encryptedText: string): Promise<string> {
  const [ivHex, tagHex, dataHex] = encryptedText.split(':')
  if (!ivHex || !tagHex || !dataHex) return encryptedText // legacy unencrypted

  const iv = new Uint8Array(ivHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
  const tag = new Uint8Array(tagHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
  const data = new Uint8Array(dataHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)))

  const ciphertext = new Uint8Array([...data, ...tag])
  const key = await importKey(encryptionKey)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}

function isEncrypted(value: string): boolean {
  const parts = value.split(':')
  return parts.length === 3 && parts.every((p) => /^[0-9a-f]+$/i.test(p))
}

// ---------------------------------------------------------------------------
// Gmail helpers
// ---------------------------------------------------------------------------

async function refreshToken(refreshTok: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: refreshTok,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`)
  return res.json()
}

async function getAccessToken(token: {
  user_id: string
  access_token: string
  refresh_token: string
  expires_at: string
}): Promise<string> {
  const accessToken = isEncrypted(token.access_token)
    ? await decrypt(token.access_token)
    : token.access_token

  if (new Date(token.expires_at) > new Date()) return accessToken

  // Refresh
  const refreshTok = isEncrypted(token.refresh_token)
    ? await decrypt(token.refresh_token)
    : token.refresh_token

  const { access_token, expires_in } = await refreshToken(refreshTok)
  const newExpiry = new Date(Date.now() + expires_in * 1000).toISOString()

  await supabase.from('gmail_tokens').update({
    access_token, // store plain for now; Next.js layer will re-encrypt on next read
    expires_at: newExpiry,
    updated_at: new Date().toISOString(),
  }).eq('user_id', token.user_id)

  return access_token
}

// ---------------------------------------------------------------------------
// Message parsing
// ---------------------------------------------------------------------------

function extractBody(payload: Record<string, unknown>): string {
  const body = payload.body as { data?: string } | undefined
  if (body?.data) {
    const decoded = atob(body.data.replace(/-/g, '+').replace(/_/g, '/'))
    const mimeType = payload.mimeType as string | undefined
    if (mimeType === 'text/html') {
      return decoded.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    }
    return decoded
  }

  const parts = payload.parts as Record<string, unknown>[] | undefined
  if (parts) {
    const plain = parts.find((p) => p.mimeType === 'text/plain')
    if (plain) return extractBody(plain)
    const html = parts.find((p) => p.mimeType === 'text/html')
    if (html) return extractBody(html)
    for (const part of parts) {
      const r = extractBody(part)
      if (r) return r
    }
  }
  return ''
}

function getHeader(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''
}

function parseEmailAddress(raw: string): { name: string; email: string } {
  const match = raw.match(/^(.+?)\s*<([^>]+)>$/)
  if (match) return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2].trim() }
  return { name: raw.trim(), email: raw.trim() }
}

// Stub: returns { urgent: false } — will connect to Gemini in Phase 12
async function flagUrgency(_subject: string, _preview: string): Promise<{ urgent: boolean }> {
  return { urgent: false }
}

// ---------------------------------------------------------------------------
// Upsert helpers
// ---------------------------------------------------------------------------

async function upsertConversation(
  parsed: {
    threadId: string
    from: string
    subject: string
    bodyPreview: string
    isUnread: boolean
  },
  businessId: string
) {
  const { name, email } = parseEmailAddress(parsed.from)

  // Check if conversation exists for this thread
  const { data: existing } = await supabase
    .from('conversations')
    .select('id, status')
    .eq('business_id', businessId)
    .eq('external_id', parsed.threadId)
    .single()

  if (existing) {
    // Update last_message_at and status if now unread
    await supabase.from('conversations').update({
      last_message_at: new Date().toISOString(),
      ...(parsed.isUnread ? { status: 'unread' } : {}),
    }).eq('id', existing.id)
    return existing.id
  }

  const { data: conv } = await supabase.from('conversations').insert({
    business_id: businessId,
    channel: 'gmail',
    external_id: parsed.threadId,
    participant_email: email,
    participant_name: name,
    subject: parsed.subject,
    status: parsed.isUnread ? 'unread' : 'read',
    last_message_at: new Date().toISOString(),
  }).select('id').single()

  return conv?.id ?? null
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async () => {
  console.log('[poll-gmail] Starting poll cycle...')

  const { data: tokens, error } = await supabase
    .from('gmail_tokens')
    .select('*, users(business_id)')

  if (error) {
    console.error('[poll-gmail] Failed to fetch tokens:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  let totalProcessed = 0

  for (const token of tokens ?? []) {
    try {
      const businessId = (token.users as { business_id: string } | null)?.business_id
      if (!businessId) continue

      const accessToken = await getAccessToken(token)

      // Fetch messages since last poll (or last 5 minutes if never polled)
      const lastPoll = token.last_polled_at ?? new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const afterSec = Math.floor(new Date(lastPoll).getTime() / 1000)
      const query = `after:${afterSec} in:inbox`

      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      const listData = await listRes.json()
      const messages: Array<{ id: string }> = listData.messages ?? []

      if (messages.length === 0) {
        console.log(`[poll-gmail] No new messages for user ${token.user_id}`)
      }

      for (const msg of messages) {
        try {
          const fullRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          )
          const msgData = await fullRes.json()

          const headers: Array<{ name: string; value: string }> = msgData.payload?.headers ?? []
          const body = extractBody(msgData.payload ?? {})

          const parsed = {
            gmailMessageId: msgData.id,
            threadId: msgData.threadId,
            from: getHeader(headers, 'From'),
            to: getHeader(headers, 'To'),
            subject: getHeader(headers, 'Subject'),
            date: getHeader(headers, 'Date'),
            bodyPreview: body.slice(0, 200),
            bodyCached: body.slice(0, 5000),
            isUnread: (msgData.labelIds ?? []).includes('UNREAD'),
          }

          // Upsert conversation
          const conversationId = await upsertConversation(parsed, businessId)

          // Check if this message already exists
          const { data: existingMsg } = await supabase
            .from('messages')
            .select('id')
            .eq('gmail_message_id', parsed.gmailMessageId)
            .single()

          if (!existingMsg) {
            const { name, email } = parseEmailAddress(parsed.from)

            await supabase.from('messages').insert({
              business_id: businessId,
              conversation_id: conversationId,
              channel: 'gmail',
              gmail_message_id: parsed.gmailMessageId,
              direction: 'inbound',
              sender_email: email,
              sender_name: name,
              subject: parsed.subject,
              body_preview: parsed.bodyPreview,
              body_cached: parsed.bodyCached,
              is_read: !parsed.isUnread,
              received_at: parsed.date ? new Date(parsed.date).toISOString() : new Date().toISOString(),
            })

            totalProcessed++
          }

          // Urgency flagging (stub for now — Gemini wired in Phase 12)
          const urgency = await flagUrgency(parsed.subject, parsed.bodyPreview)
          if (urgency.urgent && conversationId) {
            await supabase.from('conversations')
              .update({ priority: true })
              .eq('id', conversationId)

            // Create notification
            const { data: userRow } = await supabase
              .from('users')
              .select('id')
              .eq('business_id', businessId)
              .eq('role', 'admin')
              .single()

            if (userRow) {
              await supabase.from('notifications').insert({
                business_id: businessId,
                user_id: userRow.id,
                type: 'message',
                title: `Priority message: ${parsed.subject}`,
                body: parsed.bodyPreview,
                link: '/communications',
              })
            }
          }
        } catch (msgErr) {
          console.error(`[poll-gmail] Error processing message ${msg.id}:`, msgErr)
        }
      }

      // Update last_polled_at
      await supabase.from('gmail_tokens')
        .update({ last_polled_at: new Date().toISOString() })
        .eq('id', token.id)
    } catch (tokenErr) {
      console.error(`[poll-gmail] Error for user ${token.user_id}:`, tokenErr)
    }
  }

  console.log(`[poll-gmail] Done. Processed ${totalProcessed} new messages.`)
  return new Response(JSON.stringify({ ok: true, processed: totalProcessed }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
