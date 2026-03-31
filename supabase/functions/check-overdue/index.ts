// @ts-nocheck
// supabase/functions/check-overdue/index.ts
// Runs at 9am UTC daily via pg_cron.
// Finds overdue unpaid invoices and sends notifications + emails to business admins.
//
// Deploy: supabase functions deploy check-overdue

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')!
const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'https://omnexia.eu'

const supabase = createClient(supabaseUrl, serviceKey)

function invoiceOverdueHtml(params: {
  businessName: string
  clientName: string
  amount: string
  currency: string
  daysOverdue: number
  invoiceUrl: string
}): string {
  const htmlAmount = params.amount
  const approved = true
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f6f1;font-family:'DM Sans',Arial,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5">
    <div style="background:#2563EB;padding:24px 32px">
      <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.02em">Omnexia</span>
    </div>
    <div style="padding:32px">
      <h1 style="font-size:20px;font-weight:700;color:#111;margin:0 0 12px">Invoice overdue — action required</h1>
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 8px">
        An invoice for <strong>${params.clientName}</strong> is <strong>${params.daysOverdue} day${params.daysOverdue !== 1 ? 's' : ''} overdue</strong>.
      </p>
      <div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:8px;padding:16px 20px;margin:16px 0">
        <div style="font-size:13px;color:#92400E;font-weight:500">Outstanding amount</div>
        <div style="font-size:24px;font-weight:700;color:#92400E;margin-top:4px">${params.currency}${htmlAmount}</div>
      </div>
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 24px">
        Log in to <strong>${params.businessName}</strong>'s Omnexia workspace to follow up with the client or mark the invoice as paid.
      </p>
      <a href="${params.invoiceUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
        View invoice →
      </a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #eee;text-align:center">
      <span style="font-size:11px;color:#bbb">Omnexia — Business OS for European SMBs</span>
    </div>
  </div>
</body>
</html>`
}

async function sendResendEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: 'Omnexia <notifications@omnexia.eu>',
      to,
      subject,
      html,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('[check-overdue] Resend error:', err)
  }
}

Deno.serve(async () => {
  try {
    const today = new Date().toISOString().split('T')[0]

    // Fetch overdue unpaid invoices with business info
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('id, business_id, client_name, total, currency, due_date, businesses(id, name)')
      .eq('status', 'unpaid')
      .lt('due_date', today)
      .not('due_date', 'is', null)

    if (error) {
      console.error('[check-overdue] fetch error:', error)
      return new Response('error', { status: 500 })
    }

    console.log(`[check-overdue] Found ${(invoices ?? []).length} overdue invoices`)

    for (const invoice of invoices ?? []) {
      try {
        const biz = invoice.businesses as unknown as { id: string; name: string } | null
        if (!biz) continue

        const dueDate = new Date(invoice.due_date)
        const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

        // Mark invoice as overdue
        await supabase.from('invoices').update({ status: 'overdue' }).eq('id', invoice.id).eq('status', 'unpaid')

        // Find admin users for this business
        const { data: admins } = await supabase
          .from('users')
          .select('id, email, notification_preferences')
          .eq('business_id', biz.id)
          .in('role', ['admin', 'owner'])

        for (const admin of admins ?? []) {
          const prefs = (admin.notification_preferences ?? {}) as Record<string, boolean>
          const emailEnabled = prefs.overdue !== false // default true

          const title = `Invoice overdue: ${invoice.client_name}`
          const body = `${invoice.currency ?? 'EUR'} ${Number(invoice.total).toFixed(2)} — ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`
          const invoiceUrl = `${appUrl}/finance`

          // Insert in-app notification
          await supabase.from('notifications').insert({
            business_id: biz.id,
            user_id: admin.id,
            type: 'invoice_overdue',
            title,
            body,
            link: '/finance',
            is_read: false,
          })

          // Send email if enabled
          if (emailEnabled && admin.email) {
            const html = invoiceOverdueHtml({
              businessName: biz.name,
              clientName: invoice.client_name,
              amount: Number(invoice.total).toFixed(2),
              currency: invoice.currency ?? 'EUR',
              daysOverdue,
              invoiceUrl,
            })
            await sendResendEmail(
              admin.email,
              `Invoice overdue: ${invoice.client_name} — ${invoice.currency ?? 'EUR'} ${Number(invoice.total).toFixed(2)}`,
              html,
            )
          }
        }

        console.log(`[check-overdue] Processed invoice ${invoice.id} (${invoice.client_name}, ${daysOverdue}d overdue)`)
      } catch (e) {
        console.error(`[check-overdue] Error for invoice ${invoice.id}:`, e)
      }
    }

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('[check-overdue] Fatal error:', err)
    return new Response('error', { status: 500 })
  }
})
