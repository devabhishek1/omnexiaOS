// @ts-nocheck
// supabase/functions/morning-digest/index.ts
// Runs at 7am UTC daily via pg_cron.
// For each business: fetches last 24h messages, generates digest via Mistral, upserts to ai_digests.
//
// Deploy: supabase functions deploy morning-digest

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const mistralApiKey = Deno.env.get('MISTRAL_API_KEY')!

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

Deno.serve(async () => {
  try {
    // Get all businesses
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

Business context:
${profile}

Messages from the last 24 hours:
${msgList}

Format: Start with total count, then key highlights, then 1-2 recommended actions.`

        const content = await callMistral(prompt)

        await supabase.from('ai_digests').upsert({
          business_id: biz.id,
          date: today,
          content,
          message_count: (messages ?? []).length,
          urgent_count: 0,
          generated_at: new Date().toISOString(),
        }, { onConflict: 'business_id,date' })

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
