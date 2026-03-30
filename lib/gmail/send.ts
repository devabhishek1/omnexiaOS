/**
 * lib/gmail/send.ts
 * Sends a reply via the Gmail API using RFC 2822 format.
 */

import { getValidAccessToken } from './client'

interface SendReplyParams {
  userId: string
  threadId: string
  to: string
  subject: string
  body: string
  /** The original Gmail message ID to set In-Reply-To and References headers */
  inReplyToMessageId?: string
}

export async function sendReply(params: SendReplyParams): Promise<{ messageId: string }> {
  const accessToken = await getValidAccessToken(params.userId)

  // Construct RFC 2822 email
  const lines = [
    `To: ${params.to}`,
    `Subject: Re: ${params.subject.replace(/^Re:\s*/i, '')}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
  ]

  if (params.inReplyToMessageId) {
    lines.push(`In-Reply-To: <${params.inReplyToMessageId}>`)
    lines.push(`References: <${params.inReplyToMessageId}>`)
  }

  lines.push('', params.body)

  const rawEmail = lines.join('\r\n')

  // Gmail requires base64url encoding
  const encoded = Buffer.from(rawEmail).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encoded,
        threadId: params.threadId,
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gmail send failed: ${err}`)
  }

  const data = await res.json()
  return { messageId: data.id }
}
