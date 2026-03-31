// @ts-nocheck
// supabase/functions/send-notification/index.ts
// Called by other edge functions to insert a notification row (triggers Realtime push)
// and optionally fire a Resend email.
//
// Deploy: supabase functions deploy send-notification

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')!
const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'https://omnexia.app'

const supabase = createClient(supabaseUrl, serviceKey)

interface NotificationPayload {
  businessId: string
  userId: string
  type: 'message' | 'invoice_overdue' | 'time_off' | 'shift_conflict' | 'invite'
  title: string
  body: string
  link: string
  sendEmail?: boolean
  emailTo?: string
  emailSubject?: string
  emailHtml?: string
}

async function sendResendEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: 'Omnexia <notifications@omnexia.app>',
      to,
      subject,
      html,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('[send-notification] Resend error:', err)
  }
}

Deno.serve(async (req) => {
  try {
    const payload: NotificationPayload = await req.json()

    // Insert notification row — this triggers Supabase Realtime push to client
    const { error } = await supabase.from('notifications').insert({
      business_id: payload.businessId,
      user_id: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      link: payload.link,
      is_read: false,
    })

    if (error) {
      console.error('[send-notification] Insert error:', error)
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    // Optionally send transactional email via Resend
    if (payload.sendEmail && payload.emailTo && payload.emailSubject && payload.emailHtml) {
      await sendResendEmail(payload.emailTo, payload.emailSubject, payload.emailHtml)
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[send-notification] Fatal error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }
})
