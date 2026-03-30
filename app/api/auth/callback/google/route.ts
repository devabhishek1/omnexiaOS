import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const from = searchParams.get('from')

  if (code) {
    // Exchange code for session — provider_token (Gmail access token) is returned here
    const supabase = await createClient()
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && sessionData?.session) {
      const { session } = sessionData
      const user = session.user

      const admin = createAdminClient()

      // Upsert the public users row (safe for initial login before business_id exists)
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
        console.error('[callback] users upsert error:', upsertError.message)
      }

      // ── Gmail connect flow ───────────────────────────────────────────────
      // When from=onboarding the user went through OAuth to connect Gmail.
      // Supabase returns provider_token (access) and provider_refresh_token.
      if (from === 'onboarding') {
        const providerToken = session.provider_token
        const providerRefreshToken = session.provider_refresh_token

        if (providerToken) {
          // Calculate expiry — Google access tokens last 1 hour
          const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString()

          const { error: tokenError } = await admin
            .from('gmail_tokens')
            .upsert(
              {
                user_id: user.id,
                email: user.email!,
                access_token: providerToken,
                refresh_token: providerRefreshToken ?? '',
                expires_at: expiresAt,
              },
              { onConflict: 'user_id' }
            )

          if (tokenError) {
            console.error('[callback] gmail_tokens upsert error:', tokenError.message)
          } else {
            console.log('[callback] Gmail tokens saved for', user.email)
          }
        } else {
          console.warn('[callback] No provider_token returned — offline access may not have been granted')
        }

        // Set flags in the redirect URL so the client can read them via URL params
        // (localStorage is cross-tab unreliable after a full redirect)
        const redirectUrl = new URL(`${origin}/onboarding`)
        redirectUrl.searchParams.set('gmail_connected', 'true')
        redirectUrl.searchParams.set('gmail_email', user.email ?? '')
        return NextResponse.redirect(redirectUrl.toString())
      }

      // ── Normal login flow ────────────────────────────────────────────────
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

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
