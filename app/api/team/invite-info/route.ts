import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Public endpoint — returns just enough info to render the invite page (no sensitive data)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const businessId = searchParams.get('invite')

  if (!businessId) {
    return NextResponse.json({ error: 'Missing invite param' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('businesses')
    .select('name')
    .eq('id', businessId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
  }

  return NextResponse.json({ businessName: data.name })
}
