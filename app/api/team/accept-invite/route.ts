import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Called after an invited employee signs up via email/password.
// Links the new auth user to the business and the placeholder employee record.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { businessId, inviteEmail } = await request.json()
  if (!businessId) return NextResponse.json({ error: 'Missing businessId' }, { status: 400 })

  const admin = createAdminClient()
  const emailToMatch = inviteEmail ?? user.email!

  // Read module_access from the placeholder employee record (set by owner at invite time)
  const { data: empRow } = await admin
    .from('employees')
    .select('module_access')
    .eq('business_id', businessId)
    .eq('email', emailToMatch)
    .single()

  const moduleAccess = empRow?.module_access ?? {
    communications: true,
    finance: false,
    planning: true,
    team: false,
  }

  // Update the users row: link to business, mark as employee, complete onboarding
  const { error: userError } = await admin
    .from('users')
    .update({
      business_id: businessId,
      role: 'employee',
      onboarding_complete: true,
      module_access: moduleAccess,
    })
    .eq('id', user.id)

  if (userError) {
    console.error('[accept-invite] users update error:', userError.message)
    return NextResponse.json({ error: 'Failed to link user' }, { status: 500 })
  }

  // Link the placeholder employee record to this user
  const { error: empError } = await admin
    .from('employees')
    .update({ user_id: user.id, status: 'active' })
    .eq('business_id', businessId)
    .eq('email', emailToMatch)

  if (empError) {
    console.error('[accept-invite] employee link error:', empError.message)
    // Non-fatal — user is linked to business, employee record link is best-effort
  }

  return NextResponse.json({ ok: true })
}
