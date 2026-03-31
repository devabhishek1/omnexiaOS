import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateDigest } from '@/lib/mistral/digest'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: userRow } = await admin.from('users').select('business_id, locale').eq('id', user.id).single()
  if (!userRow?.business_id) return NextResponse.json({ error: 'No business' }, { status: 400 })

  // Fetch last 24h messages
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: messages } = await admin
    .from('messages')
    .select('sender_name, subject, body_preview, channel')
    .eq('business_id', userRow.business_id)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(50)

  const content = await generateDigest(messages ?? [], userRow.locale ?? 'en', userRow.business_id)

  // Upsert today's digest
  const today = new Date().toISOString().split('T')[0]
  await admin.from('ai_digests').upsert({
    business_id: userRow.business_id,
    date: today,
    content,
    message_count: messages?.length ?? 0,
    urgent_count: 0,
    generated_at: new Date().toISOString(),
  }, { onConflict: 'business_id,date' })

  return NextResponse.json({ content, date: today })
}
