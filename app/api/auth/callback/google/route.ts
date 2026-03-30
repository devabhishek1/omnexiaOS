import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const from = searchParams.get('from')

  if (code) {
    // Exchange code for session using the cookie-based server client
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Use admin client to upsert the users row — bypasses RLS so we can
        // create the row even before the user has a business_id assigned.
        const admin = createAdminClient()
        const { error: upsertError } = await admin
          .from('users')
          .upsert(
            {
              id: user.id,
              email: user.email!,
              full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? null,
              avatar_url: user.user_metadata?.avatar_url ?? null,
              role: 'admin',
            },
            { onConflict: 'id', ignoreDuplicates: true }
          )

        if (upsertError) {
          console.error('Callback users upsert error:', upsertError.message, upsertError)
        }

        // If OAuth was triggered from onboarding (Gmail connect), return there
        if (from === 'onboarding') {
          return NextResponse.redirect(`${origin}/onboarding`)
        }

        // Otherwise route based on onboarding_complete
        const { data: profile } = await admin
          .from('users')
          .select('onboarding_complete')
          .eq('id', user.id)
          .single()

        if (profile?.onboarding_complete) {
          return NextResponse.redirect(`${origin}/overview`)
        }

        return NextResponse.redirect(`${origin}/onboarding`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
