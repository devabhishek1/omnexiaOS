import { mistralChat } from './client'

export async function extractKeyInfo(body: string): Promise<{
  amounts: string[]
  dates: string[]
  names: string[]
  action_items: string[]
}> {
  const prompt = `Extract structured information from this email.
Respond ONLY with valid JSON matching this exact shape:
{ "amounts": string[], "dates": string[], "names": string[], "action_items": string[] }

Email:
${body.slice(0, 3000)}`

  try {
    const response = await mistralChat({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    })
    return JSON.parse(response.replace(/```json|```/g, '').trim())
  } catch {
    return { amounts: [], dates: [], names: [], action_items: [] }
  }
}
