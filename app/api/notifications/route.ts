import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decrypt, isEncrypted } from '@/lib/utils/crypto'

function safeDecrypt(value: string | null | undefined): string {
  if (!value) return ''
  try { return isEncrypted(value) ? decrypt(value) : value } catch { return value ?? '' }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const decrypted = (data ?? []).map((n) => ({
    ...n,
    title: safeDecrypt(n.title),
    body: safeDecrypt(n.body),
  }))

  return NextResponse.json({ notifications: decrypted })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids } = await request.json()
  const admin = createAdminClient()

  if (ids?.length) {
    await admin.from('notifications').update({ is_read: true }).in('id', ids)
  } else {
    // Mark all read for this user
    await admin.from('notifications').update({ is_read: true }).eq('user_id', user.id)
  }

  return NextResponse.json({ ok: true })
}
