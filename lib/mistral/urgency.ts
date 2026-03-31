import { mistralChat } from './client'

export async function flagUrgency(
  subject: string,
  preview: string
): Promise<{ urgent: boolean; reason: string }> {
  const prompt = `Analyse this email and determine if it is urgent for a small business.
Respond ONLY with valid JSON: { "urgent": boolean, "reason": string }

Flag urgent if: complaint, legal threat, overdue payment demand, refund request, angry customer, time-sensitive deadline.
Do NOT flag: newsletters, general enquiries, promotional emails.

Subject: ${subject}
Preview: ${preview}`

  try {
    const response = await mistralChat({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      maxTokens: 100,
    })
    return JSON.parse(response.replace(/```json|```/g, '').trim())
  } catch {
    return { urgent: false, reason: 'parse_error' }
  }
}
