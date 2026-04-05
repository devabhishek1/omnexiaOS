import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decrypt, isEncrypted } from '@/lib/utils/crypto'
import { stripQuotedReply } from '@/lib/gmail/parse'

function safeDecrypt(value: string | null | undefined): string {
  if (!value) return ''
  try {
    return isEncrypted(value) ? decrypt(value) : value
  } catch {
    return value ?? ''
  }
}

interface AttachmentMeta {
  filename: string
  mimeType: string
  attachmentId: string
  gmailMessageId: string
}

/** Parses the <ATTACHMENTS>[...json...]</ATTACHMENTS> prefix written by sync.ts */
function parseBodyWithAttachments(raw: string): { body: string; attachments: AttachmentMeta[] } {
  const match = raw.match(/^<ATTACHMENTS>(\[[\s\S]*?\])<\/ATTACHMENTS>\n?/)
  if (!match) return { body: raw, attachments: [] }
  try {
    const attachments: AttachmentMeta[] = JSON.parse(match[1])
    return { body: raw.slice(match[0].length), attachments }
  } catch {
    return { body: raw, attachments: [] }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversationId')
  if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Get user's Gmail address so we can correct direction for historically mis-classified messages
  const { data: tokenRow } = await admin
    .from('gmail_tokens')
    .select('email')
    .eq('user_id', user.id)
    .single()
  const gmailEmail = (tokenRow?.email ?? '').toLowerCase()

  const { data: messages, error } = await admin
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('received_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const decrypted = (messages ?? []).map((m) => {
    const rawBody = safeDecrypt(m.body_cached) || safeDecrypt(m.body_preview) || ''
    const { body: bodyText, attachments } = parseBodyWithAttachments(rawBody)

    const senderEmail = safeDecrypt(m.sender_email) || ''

    // Runtime direction correction: if the sender is the logged-in Gmail user,
    // treat as outbound regardless of what the DB says (fixes historically mis-stored rows)
    const direction: 'inbound' | 'outbound' =
      gmailEmail && senderEmail.toLowerCase() === gmailEmail
        ? 'outbound'
        : (m.direction as 'inbound' | 'outbound') ?? 'inbound'

    // Strip quoted reply trails only for inbound messages
    const body = direction === 'inbound' ? stripQuotedReply(bodyText) : bodyText

    return {
      id: m.id,
      direction,
      senderName: safeDecrypt(m.sender_name) || senderEmail || 'Unknown',
      senderEmail,
      body,
      timestamp: m.received_at
        ? new Date(m.received_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '',
      attachments: attachments.length > 0 ? attachments : undefined,
    }
  })

  return NextResponse.json({ messages: decrypted })
}
