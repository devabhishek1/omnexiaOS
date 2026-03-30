import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendReply } from '@/lib/gmail/send'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversationId, threadId, to, subject, replyBody, inReplyToMessageId } = body

    if (!threadId || !to || !replyBody) {
      return NextResponse.json(
        { error: 'threadId, to, and replyBody are required' },
        { status: 400 }
      )
    }

    // Send via Gmail API
    const { messageId } = await sendReply({
      userId: user.id,
      threadId,
      to,
      subject: subject ?? '(no subject)',
      body: replyBody,
      inReplyToMessageId,
    })

    const admin = createAdminClient()

    // Get business_id for this user
    const { data: userRow } = await admin
      .from('users')
      .select('business_id')
      .eq('id', user.id)
      .single()

    if (userRow?.business_id) {
      // Save outbound message to the messages table
      await admin.from('messages').insert({
        business_id: userRow.business_id,
        conversation_id: conversationId ?? null,
        channel: 'gmail',
        gmail_message_id: messageId,
        direction: 'outbound',
        sender_email: user.email,
        sender_name: 'You',
        subject: `Re: ${subject ?? '(no subject)'}`,
        body_preview: replyBody.slice(0, 200),
        body_cached: replyBody.slice(0, 5000),
        is_read: true,
        received_at: new Date().toISOString(),
      })

      // Update conversation status to 'replied'
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
