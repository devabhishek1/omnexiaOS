import { mistralChat } from './client'
import { getClientProfile } from './clientProfile'

interface Message {
  direction: 'inbound' | 'outbound'
  body_cached?: string | null
  sender_name?: string | null
}

const LANG_MAP: Record<string, string> = {
  fr: 'French', en: 'English', de: 'German', es: 'Spanish', it: 'Italian', nl: 'Dutch',
}

export async function generateReplyDraft(params: {
  thread: Message[]
  businessId: string
  locale: string
}): Promise<string> {
  const profile = await getClientProfile(params.businessId)
  const language = LANG_MAP[params.locale] ?? 'English'

  const threadText = params.thread
    .map(m => `[${m.direction === 'inbound' ? 'Client' : 'Us'}]: ${m.body_cached ?? ''}`)
    .join('\n\n---\n\n')

  const prompt = `You are an AI assistant managing business communications.
Write a professional reply to this conversation in ${language}. Always use ${language} regardless of what language the client wrote in.
Match the client's formality level. Be warm but professional.
Write ONLY the reply body — no subject line, no greeting name unless natural.

CRITICAL: Write in plain text only. No markdown. No asterisks. No hashtags. No bold or italic formatting. Write natural professional prose only.

Business context:
${profile}

Conversation thread (most recent last):
${threadText}`

  return mistralChat({
    model: 'mistral-small-latest',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
  })
}
