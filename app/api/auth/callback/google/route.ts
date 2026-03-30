import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const from = searchParams.get('from')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Always upsert the users row — trigger may not have fired yet
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? null,
            avatar_url: user.user_metadata?.avatar_url ?? null,
          }, { onConflict: 'id' })

        if (upsertError) {
          console.error('Callback users upsert error:', upsertError.message, upsertError)
        }

        // If OAuth was triggered from onboarding (Gmail connect), return there
        if (from === 'onboarding') {
          return NextResponse.redirect(`${origin}/onboarding`)
        }

        // Otherwise route based on onboarding_complete
        const { data: profile } = await supabase
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
