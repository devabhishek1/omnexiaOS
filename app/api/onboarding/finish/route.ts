import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    // 1. Verify the user is authenticated via their session cookie
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse the onboarding payload from the request body
    const body = await request.json()
    const {
      businessName,
      countryCode,
      industry,
      locale,
      companySize,
    } = body

    if (!businessName || !countryCode) {
      return NextResponse.json(
        { error: 'businessName and countryCode are required' },
        { status: 400 }
      )
    }

    // 3. Use admin client to bypass RLS for all writes
    const admin = createAdminClient()

    // Insert business row
    const { data: business, error: bizError } = await admin
      .from('businesses')
      .insert({
        name: businessName,
        country_code: countryCode,
        industry: industry ?? null,
        locale: locale ?? 'en',
        size_range: companySize ?? null,
      })
      .select('id')
      .single()

    if (bizError) {
      console.error('[onboarding/finish] business insert error:', bizError)
      return NextResponse.json({ error: bizError.message }, { status: 500 })
    }

    // Update users row: assign business_id, mark onboarding complete, sync locale
    const { error: userError } = await admin
      .from('users')
      .update({
        business_id: business.id,
        onboarding_complete: true,
        locale: locale ?? 'en',
      })
      .eq('id', user.id)

    if (userError) {
      console.error('[onboarding/finish] user update error:', userError)
      // Rollback: delete the business we just created
      await admin.from('businesses').delete().eq('id', business.id)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    return NextResponse.json({ businessId: business.id }, { status: 200 })
  } catch (err) {
    console.error('[onboarding/finish] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
