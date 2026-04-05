/**
 * lib/gmail/sync.ts
 * Upserts a parsed Gmail message into the conversations + messages tables.
 * Used by both the Pub/Sub webhook and the initial-sync endpoint.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { parseGmailMessage, parseEmailAddress, type ParsedGmailMessage } from './parse'
import { encrypt, decrypt, isEncrypted } from '@/lib/utils/crypto'

export async function upsertMessage(
  parsed: ParsedGmailMessage,
  businessId: string,
  gmailEmail: string
): Promise<void> {
  const admin = createAdminClient()
  const { name: fromName, email: fromEmail } = parseEmailAddress(parsed.from)

  // Determine direction: outbound if the sender is the authenticated Gmail user
  const isOutbound = gmailEmail
    ? fromEmail.toLowerCase() === gmailEmail.toLowerCase()
    : false
  const direction = isOutbound ? 'outbound' : 'inbound'

  // participant_email should always be the OTHER person (not the logged-in user)
  let participantEmail: string
  let participantName: string
  if (isOutbound) {
    // Take the first recipient from the To header
    const firstTo = (parsed.to || '').split(',')[0].trim()
    const { name, email } = parseEmailAddress(firstTo)
    participantEmail = email || firstTo
    participantName = name || email || firstTo
  } else {
    participantEmail = fromEmail
    participantName = fromName || fromEmail
  }

  // Encode attachment metadata into body so it survives without a schema change.
  // Format: <ATTACHMENTS>[...json...]</ATTACHMENTS>\n<body text>
  let bodyCached = parsed.bodyCached
  let bodyPreview = parsed.bodyPreview
  if (parsed.attachments.length > 0) {
    const attachmentsWithMsgId = parsed.attachments.map((a) => ({
      ...a,
      gmailMessageId: parsed.gmailMessageId,
    }))
    const prefix = `<ATTACHMENTS>${JSON.stringify(attachmentsWithMsgId)}</ATTACHMENTS>\n`
    bodyCached = (prefix + bodyCached).slice(0, 5000)
    if (!bodyPreview) bodyPreview = parsed.attachments.map((a) => `[📎 ${a.filename}]`).join(' ')
  }

  // ── Upsert conversation (keyed on business_id + threadId) ─────────────────
  const { data: conversation, error: convError } = await admin
    .from('conversations')
    .upsert(
      {
        business_id: businessId,
        channel: 'gmail',
        external_id: parsed.threadId,
        participant_email: encrypt(participantEmail),
        participant_name: encrypt(participantName),
        subject: encrypt(parsed.subject),
        status: parsed.isUnread ? 'unread' : 'read',
        last_message_at: parsed.date
          ? new Date(parsed.date).toISOString()
          : new Date().toISOString(),
      },
      { onConflict: 'business_id,external_id' }
    )
    .select('id')
    .single()

  if (convError || !conversation) {
    console.error('[sync] conversation upsert error:', convError?.message)
    return
  }

  // ── Skip if message already stored ──────────────────────────────────────
  // Exception: if the message has attachments and the stored body_cached doesn't
  // have the <ATTACHMENTS> prefix yet (synced before this feature), patch it now.
  const { data: existing } = await admin
    .from('messages')
    .select('id, body_cached')
    .eq('gmail_message_id', parsed.gmailMessageId)
    .single()

  if (existing) {
    if (parsed.attachments.length > 0 && bodyCached.startsWith('<ATTACHMENTS>')) {
      // Decrypt whatever is stored; if it fails (old binary garbage) treat as empty
      const rawStored: string = (existing as { id: string; body_cached?: string }).body_cached ?? ''
      let storedBody = ''
      try {
        storedBody = isEncrypted(rawStored) ? decrypt(rawStored) : rawStored
      } catch {
        storedBody = ''
      }
      if (!storedBody.startsWith('<ATTACHMENTS>')) {
        await admin
          .from('messages')
          .update({ body_cached: encrypt(bodyCached) })
          .eq('id', (existing as { id: string }).id)
      }
    }
    return
  }

  // ── Insert message (body encrypted at rest) ───────────────────────────────
  const { error: msgError } = await admin.from('messages').insert({
    business_id: businessId,
    conversation_id: conversation.id,
    channel: 'gmail',
    gmail_message_id: parsed.gmailMessageId,
    direction,
    sender_email: encrypt(fromEmail),
    sender_name: encrypt(fromName || fromEmail),
    subject: encrypt(parsed.subject),
    body_preview: encrypt(bodyPreview),
    body_cached: encrypt(bodyCached),
    is_read: !parsed.isUnread,
    received_at: parsed.date
      ? new Date(parsed.date).toISOString()
      : new Date().toISOString(),
  })

  if (msgError) {
    console.error('[sync] message insert error:', msgError.message)
  }
}

/**
 * Fetches ALL messages in a Gmail thread and upserts any missing ones.
 * Called when a conversation is opened so historical messages are always present.
 */
export async function fetchFullThread(
  accessToken: string,
  gmailThreadId: string,
  businessId: string,
  gmailEmail: string
): Promise<void> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${gmailThreadId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) return
  const thread = await res.json()
  const messages: unknown[] = thread.messages ?? []
  for (const msg of messages) {
    try {
      const parsed = parseGmailMessage(msg)
      await upsertMessage(parsed, businessId, gmailEmail)
    } catch (e) {
      console.error('[sync] fetchFullThread msg error:', e)
    }
  }
}

/**
 * Fetches messages since a given historyId using the Gmail History API,
 * then returns the full message objects for new INBOX messages.
 */
export async function fetchMessagesSinceHistory(
  accessToken: string,
  fromHistoryId: string,
  toHistoryId: string
): Promise<unknown[]> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${fromHistoryId}&historyTypes=messageAdded&labelId=INBOX`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) return []

  const data = await res.json()
  const history: Array<{ messagesAdded?: Array<{ message: { id: string } }> }> =
    data.history ?? []

  // Collect unique message IDs from history
  const messageIds = new Set<string>()
  for (const h of history) {
    for (const added of h.messagesAdded ?? []) {
      messageIds.add(added.message.id)
    }
  }

  // Fetch full message objects
  const messages: unknown[] = []
  for (const id of messageIds) {
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (msgRes.ok) {
      messages.push(await msgRes.json())
    }
  }

  return messages
}

/**
 * Fetches the 50 most recent INBOX messages and upserts them.
 * Called once when a user first connects Gmail.
 */
export async function initialSync(
  accessToken: string,
  businessId: string,
  gmailEmail: string
): Promise<number> {
  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:inbox&maxResults=50',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) return 0

  const { messages = [] }: { messages: Array<{ id: string }> } = await res.json()
  let count = 0

  for (const { id } of messages) {
    try {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (!msgRes.ok) continue
      const msg = await msgRes.json()
      const parsed = parseGmailMessage(msg)
      await upsertMessage(parsed, businessId, gmailEmail)
      count++
    } catch (e) {
      console.error('[sync] initial sync error for message', id, e)
    }
  }

  return count
}
