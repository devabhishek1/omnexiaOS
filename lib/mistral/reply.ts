import { mistralChat } from './client'
import { getClientProfile } from './clientProfile'

interface Message {
  direction: 'inbound' | 'outbound'
  body_cached?: string | null
  sender_name?: string | null
}

export async function generateReplyDraft(params: {
  thread: Message[]
  businessId: string
  locale: string
}): Promise<string> {
  const profile = await getClientProfile(params.businessId)

  const threadText = params.thread
    .map(m => `[${m.direction === 'inbound' ? 'Client' : 'Us'}]: ${m.body_cached ?? ''}`)
    .join('\n\n---\n\n')

  const prompt = `You are an AI assistant managing business communications.
Write a professional reply to this conversation.
Match the language of the client's last message.
Match their formality level. Be warm but professional.
Write ONLY the reply body — no subject line, no greeting name unless natural.

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
