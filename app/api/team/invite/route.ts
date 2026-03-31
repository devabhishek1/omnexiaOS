import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getResend } from '@/lib/resend/client'
import { teamInviteTemplate } from '@/lib/resend/templates/team-invite'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, role, moduleAccess } = await request.json()
  if (!email || !role) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const admin = createAdminClient()

  // Get inviter info + business
  const { data: inviterRow } = await admin
    .from('users')
    .select('full_name, business_id, businesses(name)')
    .eq('id', user.id)
    .single()

  if (!inviterRow?.business_id) {
    return NextResponse.json({ error: 'No business found' }, { status: 400 })
  }

  const businessId = inviterRow.business_id
  const businessName = (inviterRow.businesses as unknown as { name: string } | null)?.name ?? 'your company'
  const inviterName = inviterRow.full_name ?? user.email ?? 'A team member'

  // Insert placeholder employee record
  const { data: emp, error: empError } = await admin
    .from('employees')
    .insert({
      business_id: businessId,
      full_name: email.split('@')[0],
      email,
      role_title: role,
      user_id: null,
    })
    .select()
    .single()

  if (empError) {
    return NextResponse.json({ error: empError.message }, { status: 500 })
  }

  // Send invite email via Resend
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/signup?invite=${businessId}&email=${encodeURIComponent(email)}`

  try {
    const resend = getResend()
    await resend.emails.send({
      from: 'Omnexia <invites@omnexia.eu>',
      to: email,
      subject: `You've been invited to join ${businessName} on Omnexia`,
      html: teamInviteTemplate({ businessName, inviterName, inviteUrl }),
    })
  } catch (e) {
    console.error('[team/invite] Resend error:', e)
    // Non-fatal — employee record was created, email delivery failed
  }

  // Insert in-app notification for the inviter
  await admin.from('notifications').insert({
    business_id: businessId,
    user_id: user.id,
    type: 'invite',
    title: `Invitation sent to ${email}`,
    body: `Role: ${role}`,
    link: '/team',
    is_read: false,
  })

  return NextResponse.json({ ok: true, employeeId: emp.id })
}
