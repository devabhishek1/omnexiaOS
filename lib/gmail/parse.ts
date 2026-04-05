/**
 * lib/gmail/parse.ts
 * Parses a raw Gmail API message object into a structured format.
 */

export interface ParsedGmailMessage {
  gmailMessageId: string
  threadId: string
  from: string
  to: string
  subject: string
  date: string
  bodyPreview: string   // First 200 chars, plain text
  bodyCached: string    // First 5000 chars, plain text
  isUnread: boolean
}

/** Strips HTML and returns clean readable plain text, keeping links as label (url) */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<img[^>]*alt=["']([^"']*)["'][^>]*>/gi, '')  // remove images entirely
    .replace(/<img[^>]*>/gi, '')
    // Links: keep label + URL (label if meaningful, otherwise bare URL)
    .replace(/<a\s[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, url, label) => {
      const text = label.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      // Skip tracking pixels / empty anchors
      if (!url || url.startsWith('mailto:') || url === '#') return text || ''
      // If label is meaningful (not just the raw URL), show "label (url)"
      const cleanUrl = url.trim()
      if (text && text !== cleanUrl && text.length < 80) return `${text} (${cleanUrl})`
      return cleanUrl
    })
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>/gi, ' ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#\d+;/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/^ +/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Cleans plain-text email bodies */
function cleanPlainText(text: string): string {
  return text
    // Remove URLs wrapped in parens that are pure trackers (very long, encoded)
    .replace(/\(\s*https?:\/\/[^\s)]{120,}\s*\)/g, '')
    // Collapse separator lines (---, ***, ===) into a single divider
    .replace(/^[-*=]{4,}$/gm, '─────')
    .replace(/[ \t]+/g, ' ')
    .replace(/^ +/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Strips quoted reply headers added by email clients:
 *   "On Tue, Mar 31... <email@example.com> wrote:"
 *   followed by lines starting with ">"
 * This keeps only the freshly written portion of each message.
 */
export function stripQuotedReply(text: string): string {
  // Match "On [date] [name/email] wrote:" patterns (Gmail, Outlook, Apple Mail all use variants)
  const quoteHeaderPattern = /\n?On .{10,120}wrote:\s*\n[\s\S]*/i
  const stripped = text.replace(quoteHeaderPattern, '').trim()

  // Also strip lines that are purely ">" quoted text blocks
  const lines = stripped.split('\n')
  const withoutBlockquotes: string[] = []
  let inQuoteBlock = false
  for (const line of lines) {
    if (line.startsWith('>')) {
      inQuoteBlock = true
      continue
    }
    if (inQuoteBlock && line.trim() === '') {
      inQuoteBlock = false
      continue
    }
    inQuoteBlock = false
    withoutBlockquotes.push(line)
  }

  return withoutBlockquotes.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

/** Recursively extracts body text from a Gmail message payload */
function extractBody(payload: {
  mimeType?: string
  body?: { data?: string; size?: number }
  parts?: unknown[]
}): string {
  if (payload.body?.data) {
    const decoded = Buffer.from(payload.body.data, 'base64url').toString('utf-8')
    if (payload.mimeType === 'text/html') return htmlToPlainText(decoded)
    return cleanPlainText(decoded)
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    const parts = payload.parts as typeof payload[]
    const plain = parts.find((p) => p.mimeType === 'text/plain')
    if (plain) return extractBody(plain)
    const html = parts.find((p) => p.mimeType === 'text/html')
    if (html) return extractBody(html)
    for (const part of parts) {
      const result = extractBody(part)
      if (result) return result
    }
  }

  return ''
}

function getHeader(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseGmailMessage(msg: any): ParsedGmailMessage {
  const headers: Array<{ name: string; value: string }> = msg.payload?.headers ?? []
  const body = extractBody(msg.payload ?? {})

  return {
    gmailMessageId: msg.id,
    threadId: msg.threadId,
    from: getHeader(headers, 'From'),
    to: getHeader(headers, 'To'),
    subject: getHeader(headers, 'Subject'),
    date: getHeader(headers, 'Date'),
    bodyPreview: body.slice(0, 200),
    bodyCached: body.slice(0, 5000),
    isUnread: (msg.labelIds ?? []).includes('UNREAD'),
  }
}

/** Parses "Display Name <email@example.com>" → { name, email } */
export function parseEmailAddress(raw: string): { name: string; email: string } {
  const match = raw.match(/^(.+?)\s*<([^>]+)>$/)
  if (match) {
    return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2].trim() }
  }
  return { name: raw.trim(), email: raw.trim() }
}
