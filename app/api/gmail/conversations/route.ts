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

  const decrypted = (rows ?? []).map((row) => ({
    id: row.id,
    externalId: row.external_id ?? undefined,
    channel: row.channel ?? 'gmail',
    status: row.status ?? 'read',
    priority: row.priority ?? false,
    subject: safeDecrypt(row.subject) || '(no subject)',
    participantEmail: safeDecrypt(row.participant_email) || '',
    participantName: safeDecrypt(row.participant_name) || safeDecrypt(row.participant_email) || 'Unknown',
    lastMessageAt: row.last_message_at,
    labels: row.labels ?? [],
    assignedTo: row.assigned_to ?? undefined,
    isArchived: row.is_archived ?? false,
    folder: row.folder ?? 'inbox',
  }))

  return NextResponse.json({ conversations: decrypted })
}
