import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getValidAccessToken } from '@/lib/gmail/client'
import { fetchFullThread } from '@/lib/gmail/sync'

export async function POST(request: Request) {
  try {
    const { conversationId } = await request.json()
    if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: conv } = await admin
      .from('conversations')
      .select('external_id, business_id')
      .eq('id', conversationId)
      .single()

    if (!conv?.external_id) return NextResponse.json({ ok: true })

    const accessToken = await getValidAccessToken(user.id)
    await fetchFullThread(accessToken, conv.external_id, conv.business_id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[sync-thread] error:', err)
    return NextResponse.json({ ok: true }) // non-fatal
  }
}
