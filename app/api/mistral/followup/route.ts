import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateFollowupEmail } from '@/lib/mistral/followup'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { invoiceId, locale: uiLocale } = body
  if (!invoiceId) return NextResponse.json({ error: 'invoiceId required' }, { status: 400 })

  const admin = createAdminClient()
  const { data: userRow } = await admin.from('users').select('business_id, locale').eq('id', user.id).single()
  if (!userRow?.business_id) return NextResponse.json({ error: 'No business' }, { status: 400 })

  // Prefer locale sent from the UI (reflects current language selection)
  const locale = uiLocale ?? userRow.locale ?? 'en'

  const { data: invoice } = await admin
    .from('invoices')
    .select('client_name, client_email, total, currency, due_date, status')
    .eq('id', invoiceId)
    .eq('business_id', userRow.business_id)
    .single()

  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  const daysOverdue = invoice.due_date
    ? Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / 86400000)
    : 0

  const result = await generateFollowupEmail({
    clientName: invoice.client_name,
    clientEmail: invoice.client_email ?? '',
    amount: invoice.total,
    currency: invoice.currency?.trim() || 'EUR',
    daysOverdue: Math.max(daysOverdue, 0),
    businessId: userRow.business_id,
    locale,
  })

  // Return client_email so the frontend can pre-fill the To field
  return NextResponse.json({ ...result, clientEmail: invoice.client_email ?? '' })

}
