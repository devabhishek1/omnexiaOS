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

  // Upsert the users row — handles both fresh signups and cases where the row
  // was manually deleted (recreates it so FK constraints on employees don't fail)
  const { error: userError } = await admin
    .from('users')
    .upsert(
      {
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        business_id: businessId,
        role: 'employee',
        onboarding_complete: true,
        module_access: moduleAccess,
      },
      { onConflict: 'id' }
    )

  if (userError) {
    console.error('[accept-invite] users upsert error:', userError.message)
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
