import { Mistral } from '@mistralai/mistralai'

let _client: Mistral | null = null

function getClient(): Mistral {
  if (!_client) {
    _client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! })
  }
  return _client
}

export async function mistralChat(params: {
  model: 'mistral-small-latest' | 'mistral-large-latest'
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  temperature?: number
  maxTokens?: number
}): Promise<string> {
  const client = getClient()
  const response = await client.chat.complete({
    model: params.model,
    messages: params.messages,
    temperature: params.temperature ?? 0.3,
    maxTokens: params.maxTokens ?? 1000,
  })
  const content = response.choices?.[0]?.message?.content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) return content.map((c: any) => c.text ?? '').join('')
  return ''
}
