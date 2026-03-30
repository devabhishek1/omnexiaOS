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
  bodyPreview: string   // First 200 chars
  bodyCached: string    // First 5000 chars
  isUnread: boolean
}

/** Recursively extracts body text from a Gmail message payload */
function extractBody(payload: {
  mimeType?: string
  body?: { data?: string; size?: number }
  parts?: unknown[]
}): string {
  // Direct body (text/plain or text/html at top level)
  if (payload.body?.data) {
    const decoded = Buffer.from(payload.body.data, 'base64url').toString('utf-8')
    if (payload.mimeType === 'text/html') {
      // Strip HTML tags for a plain-text preview
      return decoded.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    }
    return decoded
  }

  // Multipart: walk parts
  if (payload.parts && Array.isArray(payload.parts)) {
    // Prefer text/plain over text/html
    const parts = payload.parts as typeof payload[]
    const plain = parts.find((p) => p.mimeType === 'text/plain')
    if (plain) return extractBody(plain)

    const html = parts.find((p) => p.mimeType === 'text/html')
    if (html) return extractBody(html)

    // Recurse into any nested multipart
    for (const part of parts) {
      const result = extractBody(part)
      if (result) return result
    }
  }

  return ''
}

/** Returns a header value from the Gmail message headers array */
function getHeader(
  headers: Array<{ name: string; value: string }>,
  name: string
): string {
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
  // Plain email with no display name
  return { name: raw.trim(), email: raw.trim() }
}
