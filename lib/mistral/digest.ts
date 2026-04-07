import { mistralChat } from './client'
import { getClientProfile } from './clientProfile'

interface Message {
  channel: string
  sender_name: string
  subject: string
  body_preview: string
}

interface Invoice {
  client_name: string
  total: number
  currency: string
  status?: string
  due_date?: string
}

interface Expense {
  description: string
  amount: number
  currency: string
  category: string
}

interface DigestInput {
  messages: Message[]
  newInvoices: Invoice[]
  overdueInvoices: Invoice[]
  newExpenses: Expense[]
  locale: string
  businessId: string
}

const LANG_MAP: Record<string, string> = {
  fr: 'French',
  en: 'English',
  de: 'German',
  es: 'Spanish',
  it: 'Italian',
  nl: 'Dutch',
}

export async function generateDigest(input: DigestInput): Promise<string> {
  const { messages, newInvoices, overdueInvoices, newExpenses, locale, businessId } = input
  const profile = await getClientProfile(businessId)
  const language = LANG_MAP[locale] ?? 'English'

  // Build messages section
  const msgSection = messages.length
    ? messages
        .map(
          (m) =>
            `- [${m.channel}] From: ${m.sender_name} | Subject: ${m.subject}${m.body_preview ? ` | Preview: ${m.body_preview.slice(0, 200)}` : ''}`
        )
        .join('\n')
    : '(No inbound messages in the last 24 hours)'

  // Build finance section
  const financeLines: string[] = []

  if (newInvoices.length) {
    financeLines.push(
      `New invoices (${newInvoices.length}): ` +
        newInvoices
          .map((i) => `${i.client_name} ${i.total} ${i.currency} [${i.status ?? 'unpaid'}]`)
          .join(', ')
    )
  }

  if (overdueInvoices.length) {
    financeLines.push(
      `Overdue invoices (${overdueInvoices.length}): ` +
        overdueInvoices
          .map((i) => {
            const daysOverdue = i.due_date
              ? Math.floor((Date.now() - new Date(i.due_date).getTime()) / 86400000)
              : 0
            return `${i.client_name} ${i.total} ${i.currency}${daysOverdue > 0 ? ` (${daysOverdue}d overdue)` : ''}`
          })
          .join(', ')
    )
  }

  if (newExpenses.length) {
    const totalExp = newExpenses.reduce((s, e) => s + e.amount, 0)
    financeLines.push(
      `New expenses (${newExpenses.length}), total ${totalExp.toFixed(2)} ${newExpenses[0]?.currency ?? 'EUR'}: ` +
        newExpenses
          .map((e) => `${e.description} (${e.category}) ${e.amount}`)
          .join(', ')
    )
  }

  const financeSection = financeLines.length
    ? financeLines.join('\n')
    : '(No new invoices or expenses in the last 24 hours)'

  const prompt = `You are an AI assistant for a European SMB. Write a concise daily digest in ${language}.

RULES:
- Write in plain text only. No markdown, no asterisks, no hashtags, no bullets, no bold/italic.
- Write 4-6 natural flowing sentences.
- Be direct and actionable. Only mention facts from the data below — do NOT invent names, emails, or events.
- If there are no messages and no finance changes, say so plainly.
- Highlight urgency where relevant: overdue invoices, complaints, time-sensitive requests.
- End with 1-2 concrete recommended actions based only on the data.
- Output language: ${language} only.

Business context:
${profile}

Inbound messages from the last 24 hours:
${msgSection}

Finance activity from the last 24 hours:
${financeSection}`

  return mistralChat({
    model: 'mistral-small-latest',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  })
}
