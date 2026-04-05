import { mistralChat } from './client'
import { getClientProfile } from './clientProfile'

interface Message {
  channel?: string
  sender_name?: string
  subject?: string
  body_preview?: string
}

const LANG_MAP: Record<string, string> = {
  fr: 'French', en: 'English', de: 'German', es: 'Spanish', it: 'Italian', nl: 'Dutch',
}

export async function generateDigest(
  messages: Message[],
  locale: string,
  businessId: string
): Promise<string> {
  const profile = await getClientProfile(businessId)
  const language = LANG_MAP[locale] ?? 'English'

  const msgList = messages.length
    ? messages.map(m => `- [${m.channel ?? 'email'}] From: ${m.sender_name ?? 'Unknown'} | Subject: ${m.subject ?? '(no subject)'} | Preview: ${m.body_preview ?? ''}`).join('\n')
    : '(No messages in the last 24 hours)'

  const prompt = `You are an AI assistant for a European SMB.
Write a daily digest in ${language} for the business owner.
Keep it to 4-6 sentences. Be direct and actionable.
Highlight: urgent messages, overdue payments, complaints, time-sensitive requests.

CRITICAL: Write in plain text only. No markdown. No asterisks. No hashtags. No bold or italic formatting. No bullet point symbols. Write natural, flowing professional sentences only.

Business context:
${profile}

Messages from the last 24 hours:
${msgList}

Format: Start with the total message count as a plain sentence, then key highlights as plain sentences, then 1-2 recommended actions as plain sentences.`

  return mistralChat({
    model: 'mistral-small-latest',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  })
}
