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
    return value
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
  const { data: messages, error } = await admin
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('received_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const decrypted = (messages ?? []).map((m) => {
    const rawBody = safeDecrypt(m.body_cached) || safeDecrypt(m.body_preview) || ''
    // For inbound messages strip quoted reply trails so thread reads like a chat
    const body = m.direction === 'inbound' ? stripQuotedReply(rawBody) : rawBody
    return {
      id: m.id,
      direction: m.direction,
      senderName: safeDecrypt(m.sender_name) || m.sender_email || 'Unknown',
      senderEmail: safeDecrypt(m.sender_email) || '',
      body,
      timestamp: m.received_at
        ? new Date(m.received_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '',
    }
  })

  return NextResponse.json({ messages: decrypted })
}
