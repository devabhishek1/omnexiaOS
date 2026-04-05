import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getValidAccessToken } from '@/lib/gmail/client'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gmailMessageId = searchParams.get('gmailMessageId')
  const attachmentId = searchParams.get('attachmentId')

  if (!gmailMessageId || !attachmentId) {
    return NextResponse.json({ error: 'gmailMessageId and attachmentId are required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const accessToken = await getValidAccessToken(user.id)
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(gmailMessageId)}/attachments/${encodeURIComponent(attachmentId)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch attachment from Gmail' }, { status: res.status })
    }

    const { data } = await res.json()
    // Gmail returns base64url-encoded data; convert to standard base64
    const base64 = (data as string).replace(/-/g, '+').replace(/_/g, '/')
    return NextResponse.json({ data: base64 })
  } catch (err) {
    console.error('[gmail/attachment]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
