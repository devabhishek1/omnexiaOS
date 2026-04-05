import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendReply } from '@/lib/gmail/send'
import { encrypt } from '@/lib/utils/crypto'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') ?? ''

    let conversationId: string | null = null
    let threadId: string | undefined
    let to: string
    let subject: string
    let replyBody: string
    let inReplyToMessageId: string | undefined
    let attachments: { filename: string; mimeType: string; data: Buffer }[] = []

    if (contentType.includes('multipart/form-data')) {
      const fd = await request.formData()
      conversationId = (fd.get('conversationId') as string | null) ?? null
      threadId = (fd.get('threadId') as string) || undefined
      to = fd.get('to') as string
      subject = (fd.get('subject') as string) ?? '(no subject)'
      replyBody = (fd.get('replyBody') as string) ?? ''
      inReplyToMessageId = (fd.get('inReplyToMessageId') as string) || undefined

      const files = fd.getAll('attachments') as File[]
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer()
        attachments.push({
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          data: Buffer.from(arrayBuffer),
        })
      }
    } else {
      const body = await request.json()
      conversationId = body.conversationId ?? null
      threadId = body.threadId
      to = body.to
      subject = body.subject ?? '(no subject)'
      replyBody = body.replyBody ?? ''
      inReplyToMessageId = body.inReplyToMessageId
    }

    if (!to || (!replyBody && attachments.length === 0)) {
      return NextResponse.json({ error: 'to and replyBody (or attachments) are required' }, { status: 400 })
    }

    // Send via Gmail API
    const { messageId } = await sendReply({
      userId: user.id,
      threadId,
      to,
      subject,
      body: replyBody,
      inReplyToMessageId,
      attachments: attachments.length > 0 ? attachments : undefined,
    })

    const admin = createAdminClient()

    const { data: userRow } = await admin
      .from('users')
      .select('business_id')
      .eq('id', user.id)
      .single()

    if (userRow?.business_id) {
      let targetConversationId = conversationId ?? null

      if (!targetConversationId) {
        const { data: newConv } = await admin.from('conversations').insert({
          business_id: userRow.business_id,
          channel: 'gmail',
          external_id: messageId,
          participant_email: encrypt(to),
          participant_name: encrypt(to),
          subject: encrypt(subject),
          status: 'replied',
          last_message_at: new Date().toISOString(),
        }).select('id').single()
        targetConversationId = newConv?.id ?? null
      }

      const attachmentNames = attachments.map((a) => a.filename).join(', ')
      const bodyPreview = replyBody
        ? replyBody.slice(0, 200)
        : attachmentNames
          ? `[Attachments: ${attachmentNames}]`
          : ''

      await admin.from('messages').insert({
        business_id: userRow.business_id,
        conversation_id: targetConversationId,
        channel: 'gmail',
        gmail_message_id: messageId,
        direction: 'outbound',
        sender_email: encrypt(user.email ?? ''),
        sender_name: encrypt('You'),
        subject: encrypt(subject),
        body_preview: encrypt(bodyPreview),
        body_cached: encrypt(replyBody.slice(0, 5000)),
        is_read: true,
        received_at: new Date().toISOString(),
      })

      if (conversationId) {
        await admin
          .from('conversations')
          .update({ status: 'replied', last_message_at: new Date().toISOString() })
          .eq('id', conversationId)
      }
    }

    return NextResponse.json({ success: true, messageId })
  } catch (err) {
    console.error('[gmail/send] error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
