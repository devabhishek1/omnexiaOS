/**
 * app/api/gmail/initial-sync/route.ts
 * Called once right after a user connects Gmail.
 * Seeds inbox with up to 50 recent messages.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getValidAccessToken } from '@/lib/gmail/client'
import { initialSync } from '@/lib/gmail/sync'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: userRow } = await admin
      .from('users')
      .select('business_id')
      .eq('id', user.id)
      .single()

    if (!userRow?.business_id) {
      return NextResponse.json({ error: 'No business found' }, { status: 400 })
    }

    const accessToken = await getValidAccessToken(user.id)

    // Get the user's Gmail address so direction is correctly classified
    const { data: tokenRow } = await admin
      .from('gmail_tokens')
      .select('email')
      .eq('user_id', user.id)
      .single()
    const gmailEmail = tokenRow?.email ?? ''

    const count = await initialSync(accessToken, userRow.business_id, gmailEmail)

    return NextResponse.json({ ok: true, synced: count })
  } catch (err) {
    console.error('[initial-sync]', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
