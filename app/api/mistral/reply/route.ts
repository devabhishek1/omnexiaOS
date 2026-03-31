import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateReplyDraft } from '@/lib/mistral/reply'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conversationId } = await request.json()
  if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 })

  const admin = createAdminClient()

  const { data: userRow } = await admin.from('users').select('business_id, locale').eq('id', user.id).single()
  if (!userRow?.business_id) return NextResponse.json({ error: 'No business' }, { status: 400 })

  const { data: messages } = await admin
    .from('messages')
    .select('direction, body_cached, sender_name')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(10)

  const draft = await generateReplyDraft({
    thread: messages ?? [],
    businessId: userRow.business_id,
    locale: userRow.locale ?? 'en',
  })

  return NextResponse.json({ draft, conversationId, model: 'mistral-small-latest' })
}
