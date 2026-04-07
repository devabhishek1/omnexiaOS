import { mistralChat } from './client'
import { getClientProfile } from './clientProfile'

const LANG_MAP: Record<string, string> = {
  fr: 'French', en: 'English', de: 'German', es: 'Spanish', it: 'Italian', nl: 'Dutch',
}

// Locale-aware fallback strings for when Mistral returns non-JSON
const FALLBACK: Record<string, { subject: (amt: string, days: number) => string; body: (name: string, amt: string, days: number) => string }> = {
  en: {
    subject: (amt, days) => `Payment reminder — ${amt} (${days} days overdue)`,
    body: (name, amt, days) => `Dear ${name},\n\nWe are writing to inform you that your invoice of ${amt} is now ${days} days overdue.\n\nWe kindly ask you to arrange payment at your earliest convenience. If you have already made the payment, please disregard this notice.\n\nThank you for your prompt attention to this matter.\n\nBest regards`,
  },
  fr: {
    subject: (amt, days) => `Rappel de paiement — ${amt} (${days} jours de retard)`,
    body: (name, amt, days) => `Cher(e) ${name},\n\nNous vous contactons afin de vous rappeler que votre facture de ${amt} est en retard de ${days} jours.\n\nNous vous prions de bien vouloir procéder au règlement dans les meilleurs délais. Si vous avez déjà effectué le paiement, veuillez ignorer ce message.\n\nNous vous remercions de votre diligence.\n\nCordialement`,
  },
  de: {
    subject: (amt, days) => `Zahlungserinnerung — ${amt} (${days} Tage überfällig)`,
    body: (name, amt, days) => `Sehr geehrte(r) ${name},\n\nwir möchten Sie darauf hinweisen, dass Ihre Rechnung über ${amt} seit ${days} Tagen überfällig ist.\n\nWir bitten Sie, die ausstehende Zahlung schnellstmöglich zu veranlassen. Falls Sie die Zahlung bereits geleistet haben, betrachten Sie dieses Schreiben als gegenstandslos.\n\nVielen Dank für Ihre Aufmerksamkeit.\n\nMit freundlichen Grüßen`,
  },
  es: {
    subject: (amt, days) => `Recordatorio de pago — ${amt} (${days} días de retraso)`,
    body: (name, amt, days) => `Estimado/a ${name},\n\nNos ponemos en contacto con usted para informarle que su factura por ${amt} lleva ${days} días pendiente de pago.\n\nLe solicitamos amablemente que realice el pago a la mayor brevedad posible. Si ya ha realizado el pago, ignore este mensaje.\n\nGracias por su atención.\n\nAtentamente`,
  },
  it: {
    subject: (amt, days) => `Promemoria di pagamento — ${amt} (${days} giorni in ritardo)`,
    body: (name, amt, days) => `Gentile ${name},\n\nLe scriviamo per informarla che la sua fattura di ${amt} è in ritardo di ${days} giorni.\n\nLa preghiamo di provvedere al pagamento quanto prima. Se ha già effettuato il pagamento, ignori questo messaggio.\n\nGrazie per la sua cortese attenzione.\n\nCordiali saluti`,
  },
  nl: {
    subject: (amt, days) => `Betalingsherinnering — ${amt} (${days} dagen achterstallig)`,
    body: (name, amt, days) => `Geachte ${name},\n\nWij schrijven u om u eraan te herinneren dat uw factuur van ${amt} al ${days} dagen achterstallig is.\n\nWij verzoeken u vriendelijk de betaling zo spoedig mogelijk te voldoen. Als u al heeft betaald, kunt u dit bericht negeren.\n\nHartelijk dank voor uw aandacht.\n\nMet vriendelijke groet`,
  },
}

function formatAmount(amount: number, currency: string): string {
  const curr = currency?.trim()
  const validCurr = curr && curr.length === 3 ? curr : 'EUR'
  try {
    return new Intl.NumberFormat('en-EU', { style: 'currency', currency: validCurr }).format(amount)
  } catch {
    return `${validCurr} ${amount.toFixed(2)}`
  }
}

export async function generateFollowupEmail(params: {
  clientName: string
  clientEmail: string
  amount: number
  currency: string
  daysOverdue: number
  businessId: string
  locale: string
}): Promise<{ subject: string; body: string }> {
  const profile = await getClientProfile(params.businessId)
  const language = LANG_MAP[params.locale] ?? 'English'
  const formattedAmount = formatAmount(params.amount, params.currency)

  const prompt = `Write a professional payment reminder email in ${language}.
The email is from the business owner to a client whose invoice is overdue.
Tone: firm but polite. Not aggressive. Professional. End with a clear call to action.

YOU MUST return ONLY a valid JSON object on a single line, no extra text before or after:
{"subject":"...","body":"..."}

Rules for the body:
- Plain text only — no markdown, no asterisks, no hashtags, no bold/italic
- Natural professional prose paragraphs separated by \\n\\n
- Sign off with the business name from the context below
- Write entirely in ${language}

Business context:
${profile}

Invoice details:
- Client name: ${params.clientName}
- Client email: ${params.clientEmail}
- Amount due: ${formattedAmount}
- Days overdue: ${params.daysOverdue}`

  try {
    const response = await mistralChat({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    })

    // Strip any markdown code fences and find the JSON object
    const cleaned = response.replace(/```json|```/g, '').trim()
    // Try to extract JSON even if there's surrounding text
    const jsonMatch = cleaned.match(/\{[\s\S]*"subject"[\s\S]*"body"[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(cleaned)
  } catch {
    // Locale-aware fallback — never falls back to English for non-English locales
    const fb = FALLBACK[params.locale] ?? FALLBACK.en
    return {
      subject: fb.subject(formattedAmount, params.daysOverdue),
      body: fb.body(params.clientName, formattedAmount, params.daysOverdue),
    }
  }
}
