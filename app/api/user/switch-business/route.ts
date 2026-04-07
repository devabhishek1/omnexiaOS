import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// PATCH /api/user/switch-business
// Body: { businessId: string }
// Switches the user's active business, updating role + module_access from user_businesses.
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { businessId } = await request.json()
  if (!businessId) return NextResponse.json({ error: 'Missing businessId' }, { status: 400 })

  const admin = createAdminClient()

  // Verify the user is actually a member of the target business
  const { data: membership, error: memberError } = await admin
    .from('user_businesses')
    .select('role, module_access')
    .eq('user_id', user.id)
    .eq('business_id', businessId)
    .single()

  if (memberError || !membership) {
    return NextResponse.json({ error: 'Not a member of this business' }, { status: 403 })
  }

  // Switch the user's active business + sync role/module_access for that business
  const { error } = await admin
    .from('users')
    .update({
      business_id: businessId,
      active_business_id: businessId,
      role: membership.role,
      module_access: membership.module_access,
    })
    .eq('id', user.id)

  if (error) {
    console.error('[switch-business] update error:', error.message)
    return NextResponse.json({ error: 'Failed to switch business' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
