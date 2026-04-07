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

type EmailLocale = 'en' | 'fr' | 'de' | 'es' | 'it' | 'nl'
const overdueStrings: Record<EmailLocale, {
  subject: (client: string, currency: string, amount: string) => string
  heading: string
  body: (client: string, days: number) => string
  outstandingAmount: string
  action: (biz: string) => string
  button: string
  footer: string
  notifTitle: (client: string) => string
  notifBody: (currency: string, amount: string, days: number) => string
}> = {
  en: {
    subject: (client, currency, amount) => `Invoice overdue: ${client} — ${currency} ${amount}`,
    heading: 'Invoice overdue — action required',
    body: (client, days) => `An invoice for <strong>${client}</strong> is <strong>${days} day${days !== 1 ? 's' : ''} overdue</strong>.`,
    outstandingAmount: 'Outstanding amount',
    action: (biz) => `Log in to <strong>${biz}</strong>'s Omnexia workspace to follow up with the client or mark the invoice as paid.`,
    button: 'View invoice →',
    footer: 'Omnexia — Business OS for European SMBs',
    notifTitle: (client) => `Invoice overdue: ${client}`,
    notifBody: (currency, amount, days) => `${currency} ${amount} — ${days} day${days !== 1 ? 's' : ''} overdue`,
  },
  fr: {
    subject: (client, currency, amount) => `Facture en retard : ${client} — ${currency} ${amount}`,
    heading: 'Facture en retard — action requise',
    body: (client, days) => `Une facture pour <strong>${client}</strong> est en retard de <strong>${days} jour${days !== 1 ? 's' : ''}</strong>.`,
    outstandingAmount: 'Montant dû',
    action: (biz) => `Connectez-vous à l'espace Omnexia de <strong>${biz}</strong> pour contacter le client ou marquer la facture comme payée.`,
    button: 'Voir la facture →',
    footer: 'Omnexia — OS métier pour les PME européennes',
    notifTitle: (client) => `Facture en retard : ${client}`,
    notifBody: (currency, amount, days) => `${currency} ${amount} — ${days} jour${days !== 1 ? 's' : ''} de retard`,
  },
  de: {
    subject: (client, currency, amount) => `Rechnung überfällig: ${client} — ${currency} ${amount}`,
    heading: 'Rechnung überfällig — Handlung erforderlich',
    body: (client, days) => `Eine Rechnung für <strong>${client}</strong> ist <strong>${days} Tag${days !== 1 ? 'e' : ''} überfällig</strong>.`,
    outstandingAmount: 'Ausstehender Betrag',
    action: (biz) => `Melden Sie sich beim Omnexia-Workspace von <strong>${biz}</strong> an, um den Kunden zu kontaktieren oder die Rechnung als bezahlt zu markieren.`,
    button: 'Rechnung ansehen →',
    footer: 'Omnexia — Business OS für europäische KMU',
    notifTitle: (client) => `Rechnung überfällig: ${client}`,
    notifBody: (currency, amount, days) => `${currency} ${amount} — ${days} Tag${days !== 1 ? 'e' : ''} überfällig`,
  },
  es: {
    subject: (client, currency, amount) => `Factura vencida: ${client} — ${currency} ${amount}`,
    heading: 'Factura vencida — acción requerida',
    body: (client, days) => `Una factura para <strong>${client}</strong> lleva <strong>${days} día${days !== 1 ? 's' : ''} de retraso</strong>.`,
    outstandingAmount: 'Monto pendiente',
    action: (biz) => `Inicia sesión en el espacio de trabajo Omnexia de <strong>${biz}</strong> para hacer seguimiento al cliente o marcar la factura como pagada.`,
    button: 'Ver factura →',
    footer: 'Omnexia — OS empresarial para PYME europeas',
    notifTitle: (client) => `Factura vencida: ${client}`,
    notifBody: (currency, amount, days) => `${currency} ${amount} — ${days} día${days !== 1 ? 's' : ''} de retraso`,
  },
  it: {
    subject: (client, currency, amount) => `Fattura scaduta: ${client} — ${currency} ${amount}`,
    heading: 'Fattura scaduta — azione richiesta',
    body: (client, days) => `Una fattura per <strong>${client}</strong> è scaduta da <strong>${days} giorno${days !== 1 ? 'i' : ''}</strong>.`,
    outstandingAmount: 'Importo in sospeso',
    action: (biz) => `Accedi allo spazio di lavoro Omnexia di <strong>${biz}</strong> per contattare il cliente o contrassegnare la fattura come pagata.`,
    button: 'Visualizza fattura →',
    footer: 'Omnexia — OS aziendale per le PMI europee',
    notifTitle: (client) => `Fattura scaduta: ${client}`,
    notifBody: (currency, amount, days) => `${currency} ${amount} — ${days} giorno${days !== 1 ? 'i' : ''} di ritardo`,
  },
  nl: {
    subject: (client, currency, amount) => `Factuur achterstallig: ${client} — ${currency} ${amount}`,
    heading: 'Factuur achterstallig — actie vereist',
    body: (client, days) => `Een factuur voor <strong>${client}</strong> is <strong>${days} dag${days !== 1 ? 'en' : ''} achterstallig</strong>.`,
    outstandingAmount: 'Openstaand bedrag',
    action: (biz) => `Log in op de Omnexia-werkruimte van <strong>${biz}</strong> om contact op te nemen met de klant of de factuur als betaald te markeren.`,
    button: 'Factuur bekijken →',
    footer: 'Omnexia — Business OS voor Europees MKB',
    notifTitle: (client) => `Factuur achterstallig: ${client}`,
    notifBody: (currency, amount, days) => `${currency} ${amount} — ${days} dag${days !== 1 ? 'en' : ''} achterstallig`,
  },
}

function getOverdueStrings(locale: string) {
  const supported: EmailLocale[] = ['en', 'fr', 'de', 'es', 'it', 'nl']
  const l = locale as EmailLocale
  return overdueStrings[supported.includes(l) ? l : 'en']
}

function invoiceOverdueHtml(params: {
  businessName: string
  clientName: string
  amount: string
  currency: string
  daysOverdue: number
  invoiceUrl: string
  locale: string
}): string {
  const s = getOverdueStrings(params.locale)
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f6f1;font-family:'DM Sans',Arial,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5">
    <div style="background:#2563EB;padding:24px 32px">
      <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.02em">Omnexia</span>
    </div>
    <div style="padding:32px">
      <h1 style="font-size:20px;font-weight:700;color:#111;margin:0 0 12px">${s.heading}</h1>
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 8px">
        ${s.body(params.clientName, params.daysOverdue)}
      </p>
      <div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:8px;padding:16px 20px;margin:16px 0">
        <div style="font-size:13px;color:#92400E;font-weight:500">${s.outstandingAmount}</div>
        <div style="font-size:24px;font-weight:700;color:#92400E;margin-top:4px">${params.currency} ${params.amount}</div>
      </div>
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 24px">
        ${s.action(params.businessName)}
      </p>
      <a href="${params.invoiceUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
        ${s.button}
      </a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #eee;text-align:center">
      <span style="font-size:11px;color:#bbb">${s.footer}</span>
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
      .select('id, business_id, client_name, total, currency, due_date, businesses(id, name, locale)')
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
        const biz = invoice.businesses as unknown as { id: string; name: string; locale?: string } | null
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

          const locale = biz.locale ?? 'en'
          const os = getOverdueStrings(locale)
          const currency = invoice.currency ?? 'EUR'
          const amount = Number(invoice.total).toFixed(2)
          const title = os.notifTitle(invoice.client_name)
          const body = os.notifBody(currency, amount, daysOverdue)
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
              amount,
              currency,
              daysOverdue,
              invoiceUrl,
              locale,
            })
            await sendResendEmail(
              admin.email,
              os.subject(invoice.client_name, currency, amount),
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
