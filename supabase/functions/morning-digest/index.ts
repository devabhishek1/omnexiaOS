// @ts-nocheck
// supabase/functions/morning-digest/index.ts
// Runs at 7am UTC daily via pg_cron.
// For each business: fetches last 24h messages, generates digest via Mistral,
// upserts to ai_digests, and sends digest email to admins with digest_email enabled.
//
// Deploy: supabase functions deploy morning-digest

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const mistralApiKey = Deno.env.get('MISTRAL_API_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')!
const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'https://omnexia.eu'

const supabase = createClient(supabaseUrl, serviceKey)

const LANG_MAP: Record<string, string> = {
  fr: 'French', en: 'English', de: 'German', es: 'Spanish', it: 'Italian', nl: 'Dutch',
}

async function callMistral(prompt: string): Promise<string> {
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mistralApiKey}`,
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 600,
    }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

function digestEmailHtml(params: {
  businessName: string
  date: string
  content: string
  messageCount: number
  dashboardUrl: string
}): string {
  const htmlContent = params.content.replace(/\n/g, '<br>')
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f6f1;font-family:'DM Sans',Arial,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5">
    <div style="background:#2563EB;padding:24px 32px">
      <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.02em">Omnexia</span>
    </div>
    <div style="padding:32px">
      <div style="margin-bottom:16px">
        <span style="background:#EEF2FF;color:#6366F1;font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px;letter-spacing:0.04em">✦ AI DIGEST</span>
        <span style="font-size:12px;color:#999;margin-left:8px">${params.date}</span>
      </div>
      <h1 style="font-size:20px;font-weight:700;color:#111;margin:0 0 12px">Good morning, ${params.businessName}</h1>
      <p style="font-size:13px;color:#777;margin:0 0 20px">${params.messageCount} message${params.messageCount !== 1 ? 's' : ''} in the last 24 hours</p>
      <div style="font-size:14px;color:#333;line-height:1.7;margin:0 0 24px;padding:20px;background:#F8F8F5;border-radius:8px;border-left:3px solid #6366F1">
        ${htmlContent}
      </div>
      <a href="${params.dashboardUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
        Open dashboard →
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
      from: 'Omnexia <digest@omnexia.eu>',
      to,
      subject,
      html,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('[morning-digest] Resend error:', err)
  }
}

Deno.serve(async () => {
  try {
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, name, industry, country_code, locale, ai_context')

    if (error) {
      console.error('[morning-digest] fetch businesses error:', error)
      return new Response('error', { status: 500 })
    }

    const today = new Date().toISOString().split('T')[0]
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    for (const biz of businesses ?? []) {
      try {
        const { data: messages } = await supabase
          .from('messages')
          .select('sender_name, subject, body_preview, channel')
          .eq('business_id', biz.id)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(50)

        const language = LANG_MAP[biz.locale] ?? 'English'
        const msgList = (messages ?? []).length
          ? (messages ?? []).map((m: any) => `- [${m.channel ?? 'email'}] From: ${m.sender_name ?? 'Unknown'} | Subject: ${m.subject ?? '(no subject)'} | Preview: ${m.body_preview ?? ''}`).join('\n')
          : '(No messages in the last 24 hours)'

        const profile = [
          `Business name: ${biz.name}`,
          `Industry: ${biz.industry ?? 'Not specified'}`,
          `Country: ${biz.country_code}`,
          `Language: ${biz.locale}`,
          `Additional context: ${biz.ai_context ?? 'None provided'}`,
        ].join('\n')

        const prompt = `You are an AI assistant for a European SMB.
Write a daily digest in ${language} for the business owner.
Keep it to 4-6 sentences. Be direct and actionable.
Highlight: urgent messages, overdue payments, complaints, time-sensitive requests.

CRITICAL: Write in plain text only. No markdown. No asterisks. No hashtags. No bold or italic formatting. No bullet point symbols. Write natural flowing professional sentences only.

Business context:
${profile}

Messages from the last 24 hours:
${msgList}

Format: Start with the total message count as a plain sentence, then key highlights as plain sentences, then 1-2 recommended actions as plain sentences.`

        const content = await callMistral(prompt)

        await supabase.from('ai_digests').upsert({
          business_id: biz.id,
          date: today,
          content,
          message_count: (messages ?? []).length,
          urgent_count: 0,
          generated_at: new Date().toISOString(),
        }, { onConflict: 'business_id,date' })

        // Send digest email to admins who have digest_email enabled
        const { data: admins } = await supabase
          .from('users')
          .select('id, email, notification_preferences')
          .eq('business_id', biz.id)
          .in('role', ['admin', 'owner'])

        for (const admin of admins ?? []) {
          const prefs = (admin.notification_preferences ?? {}) as Record<string, boolean | string>
          const digestEnabled = prefs.digest_enabled !== false
          const emailEnabled = prefs.digest_email !== false

          if (digestEnabled && emailEnabled && admin.email) {
            await sendResendEmail(
              admin.email,
              `Your Omnexia morning digest — ${today}`,
              digestEmailHtml({
                businessName: biz.name,
                date: today,
                content,
                messageCount: (messages ?? []).length,
                dashboardUrl: `${appUrl}/overview`,
              }),
            )
          }
        }

        console.log(`[morning-digest] Generated digest for ${biz.name}`)
      } catch (e) {
        console.error(`[morning-digest] Error for business ${biz.id}:`, e)
      }
    }

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('[morning-digest] Fatal error:', err)
    return new Response('error', { status: 500 })
  }
})
