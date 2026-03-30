/**
 * lib/gmail/sync.ts
 * Upserts a parsed Gmail message into the conversations + messages tables.
 * Used by both the Pub/Sub webhook and the initial-sync endpoint.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { parseGmailMessage, parseEmailAddress, type ParsedGmailMessage } from './parse'

export async function upsertMessage(
  parsed: ParsedGmailMessage,
  businessId: string
): Promise<void> {
  const admin = createAdminClient()
  const { name, email } = parseEmailAddress(parsed.from)

  // ── Upsert conversation (keyed on business_id + threadId) ─────────────────
  const { data: conversation, error: convError } = await admin
    .from('conversations')
    .upsert(
      {
        business_id: businessId,
        channel: 'gmail',
        external_id: parsed.threadId,
        participant_email: email,
        participant_name: name,
        subject: parsed.subject,
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

  // ── Skip if message already stored ────────────────────────────────────────
  const { data: existing } = await admin
    .from('messages')
    .select('id')
    .eq('gmail_message_id', parsed.gmailMessageId)
    .single()

  if (existing) return

  // ── Insert message ────────────────────────────────────────────────────────
  const { error: msgError } = await admin.from('messages').insert({
    business_id: businessId,
    conversation_id: conversation.id,
    channel: 'gmail',
    gmail_message_id: parsed.gmailMessageId,
    direction: 'inbound',
    sender_email: email,
    sender_name: name,
    subject: parsed.subject,
    body_preview: parsed.bodyPreview,
    body_cached: parsed.bodyCached,
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
  businessId: string
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
      await upsertMessage(parsed, businessId)
      count++
    } catch (e) {
      console.error('[sync] initial sync error for message', id, e)
    }
  }

  return count
}
