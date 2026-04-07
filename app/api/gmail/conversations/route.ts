import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decrypt, isEncrypted } from '@/lib/utils/crypto'

function safeDecrypt(value: string | null | undefined): string {
  if (!value) return ''
  try {
    return isEncrypted(value) ? decrypt(value) : value
  } catch {
    return value ?? ''
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  if (!userRow?.business_id) return NextResponse.json({ conversations: [] })

  const admin = createAdminClient()
  const { data: rows, error } = await admin
    .from('conversations')
    .select('*')
    .eq('business_id', userRow.business_id)
    .order('last_message_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── Compute effective status from actual last message direction ────────────
  // This ensures "replied" is correct even for conversations synced before the
  // direction-aware status fix — without requiring a full re-sync.
  // We fetch the latest message per conversation in one query (ordered desc),
  // then build a map with JS-level dedup (first occurrence = most recent).
  const convIds = (rows ?? []).map((r) => r.id)
  let lastDirMap = new Map<string, string>() // conversationId → 'inbound'|'outbound'

  if (convIds.length > 0) {
    const { data: lastMsgs } = await admin
      .from('messages')
      .select('conversation_id, direction')
      .in('conversation_id', convIds)
      .order('received_at', { ascending: false })

    for (const msg of lastMsgs ?? []) {
      // First occurrence per conversation_id = most recent message
      if (!lastDirMap.has(msg.conversation_id)) {
        lastDirMap.set(msg.conversation_id, msg.direction)
      }
    }
  }

  const decrypted = (rows ?? []).map((row) => {
    const lastDir = lastDirMap.get(row.id)
    // Derive status: if last message is outbound → 'replied', else use DB value
    const effectiveStatus = lastDir === 'outbound'
      ? 'replied'
      : (row.status ?? 'read')

    return {
      id: row.id,
      externalId: row.external_id ?? undefined,
      channel: row.channel ?? 'gmail',
      status: effectiveStatus,
      priority: row.priority ?? false,
      subject: safeDecrypt(row.subject) || '(no subject)',
      participantEmail: safeDecrypt(row.participant_email) || '',
      participantName: safeDecrypt(row.participant_name) || safeDecrypt(row.participant_email) || 'Unknown',
      lastMessageAt: row.last_message_at,
      labels: row.labels ?? [],
      assignedTo: row.assigned_to ?? undefined,
      isArchived: row.is_archived ?? false,
      folder: row.folder ?? 'inbox',
    }
  })

  return NextResponse.json({ conversations: decrypted })
}
