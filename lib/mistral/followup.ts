import { mistralChat } from './client'
import { getClientProfile } from './clientProfile'

const LANG_MAP: Record<string, string> = {
  fr: 'French', en: 'English', de: 'German', es: 'Spanish', it: 'Italian', nl: 'Dutch',
}

export async function generateFollowupEmail(params: {
  clientName: string
  amount: number
  currency: string
  daysOverdue: number
  businessId: string
  locale: string
}): Promise<{ subject: string; body: string }> {
  const profile = await getClientProfile(params.businessId)
  const language = LANG_MAP[params.locale] ?? 'English'

  const prompt = `Write a professional payment reminder email in ${language}.
The email is from the business to a client with an overdue invoice.
Tone: firm but polite. Not aggressive. Professional.
Return JSON only: { "subject": string, "body": string }

Business context: ${profile}
Client: ${params.clientName}
Amount: ${params.currency}${params.amount}
Days overdue: ${params.daysOverdue}`

  try {
    const response = await mistralChat({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    })
    return JSON.parse(response.replace(/```json|```/g, '').trim())
  } catch {
    return {
      subject: `Payment reminder — ${params.currency}${params.amount}`,
      body: `Dear ${params.clientName},\n\nThis is a reminder that your invoice of ${params.currency}${params.amount} is ${params.daysOverdue} days overdue.\n\nPlease arrange payment at your earliest convenience.\n\nBest regards`,
    }
  }
}
