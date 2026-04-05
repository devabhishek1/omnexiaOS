/**
 * lib/gmail/send.ts
 * Sends a reply via the Gmail API using RFC 2822 / multipart MIME format.
 * Supports plain-text replies and optional file attachments.
 */

import { getValidAccessToken } from './client'

interface SendReplyParams {
  userId: string
  threadId?: string
  to: string
  subject: string
  body: string
  inReplyToMessageId?: string
  attachments?: { filename: string; mimeType: string; data: Buffer }[]
}

function buildMimeMessage(params: SendReplyParams): string {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const isReply = !!params.threadId
  const subjectLine = isReply
    ? `Re: ${params.subject.replace(/^Re:\s*/i, '')}`
    : params.subject

  const headers = [
    `To: ${params.to}`,
    `Subject: ${subjectLine}`,
    'MIME-Version: 1.0',
  ]

  if (params.inReplyToMessageId) {
    headers.push(`In-Reply-To: <${params.inReplyToMessageId}>`)
    headers.push(`References: <${params.inReplyToMessageId}>`)
  }

  if (!params.attachments || params.attachments.length === 0) {
    // Simple plain-text — no multipart needed
    headers.push('Content-Type: text/plain; charset=utf-8')
    return [...headers, '', params.body].join('\r\n')
  }

  // Multipart/mixed for attachments
  headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`)

  const parts: string[] = [
    ...headers,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    params.body,
  ]

  for (const att of params.attachments) {
    parts.push(
      `--${boundary}`,
      `Content-Type: ${att.mimeType}; name="${att.filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${att.filename}"`,
      '',
      att.data.toString('base64'),
    )
  }

  parts.push(`--${boundary}--`)
  return parts.join('\r\n')
}

export async function sendReply(params: SendReplyParams): Promise<{ messageId: string }> {
  const accessToken = await getValidAccessToken(params.userId)

  const rawEmail = buildMimeMessage(params)

  // Gmail requires base64url encoding
  const encoded = Buffer.from(rawEmail)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const gmailBody: Record<string, string> = { raw: encoded }
  if (params.threadId) gmailBody.threadId = params.threadId

  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gmailBody),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gmail send failed: ${err}`)
  }

  const data = await res.json()
  return { messageId: data.id }
}
