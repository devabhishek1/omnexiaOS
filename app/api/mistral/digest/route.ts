import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateDigest } from '@/lib/mistral/digest'
import { decrypt, isEncrypted } from '@/lib/utils/crypto'

function safeDecrypt(value: string | null | undefined): string {
  if (!value) return ''
  try {
    return isEncrypted(value) ? decrypt(value) : value
  } catch {
    return value ?? ''
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: userRow } = await admin
    .from('users')
    .select('business_id, locale')
    .eq('id', user.id)
    .single()
  if (!userRow?.business_id) return NextResponse.json({ error: 'No business' }, { status: 400 })

  // Locale: prefer explicit param from UI (language changed) over stored value
  let locale = userRow.locale ?? 'en'
  try {
    const body = await req.json().catch(() => ({}))
    if (body?.locale) locale = body.locale
  } catch { /* no body is fine */ }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // ── Fetch messages from last 24h and decrypt all encrypted fields ──────────
  const { data: rawMessages } = await admin
    .from('messages')
    .select('sender_name, sender_email, subject, body_preview, channel, direction, received_at')
    .eq('business_id', userRow.business_id)
    .eq('direction', 'inbound')
    .gte('received_at', since)
    .order('received_at', { ascending: false })
    .limit(50)

  const messages = (rawMessages ?? []).map((m) => ({
    channel: m.channel ?? 'gmail',
    sender_name: safeDecrypt(m.sender_name) || safeDecrypt(m.sender_email) || 'Unknown',
    subject: safeDecrypt(m.subject) || '(no subject)',
    body_preview: safeDecrypt(m.body_preview) || '',
  }))

  // ── Fetch finance changes from last 24h ────────────────────────────────────
  const { data: newInvoices } = await admin
    .from('invoices')
    .select('client_name, total, currency, status, due_date')
    .eq('business_id', userRow.business_id)
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  const { data: overdueInvoices } = await admin
    .from('invoices')
    .select('client_name, total, currency, due_date')
    .eq('business_id', userRow.business_id)
    .eq('status', 'overdue')

  const { data: newExpenses } = await admin
    .from('expenses')
    .select('description, amount, currency, category')
    .eq('business_id', userRow.business_id)
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  const content = await generateDigest({
    messages,
    newInvoices: newInvoices ?? [],
    overdueInvoices: overdueInvoices ?? [],
    newExpenses: newExpenses ?? [],
    locale,
    businessId: userRow.business_id,
  })

  // Upsert today's digest
  const today = new Date().toISOString().split('T')[0]
  await admin.from('ai_digests').upsert(
    {
      business_id: userRow.business_id,
      date: today,
      content,
      locale,
      message_count: messages.length,
      urgent_count: 0,
      generated_at: new Date().toISOString(),
    },
    { onConflict: 'business_id,date' }
  )

  return NextResponse.json({ content, date: today })
}
