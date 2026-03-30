import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { encrypt } from '@/lib/utils/crypto'
import { registerGmailWatch } from '@/lib/gmail/watch'
import { initialSync } from '@/lib/gmail/sync'
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

        let tokenSaved = false

        if (providerToken) {
          const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString()

          // Get business_id so the edge function can join tokens → business
          const { data: userRow } = await admin
            .from('users')
            .select('business_id')
            .eq('id', user.id)
            .single()

          // Try DELETE + INSERT to avoid needing a unique constraint during setup
          await admin.from('gmail_tokens').delete().eq('user_id', user.id)

          const { error: tokenError } = await admin.from('gmail_tokens').insert({
            user_id: user.id,
            business_id: userRow?.business_id ?? null,
            email: user.email!,
            access_token: encrypt(providerToken),
            refresh_token: encrypt(providerRefreshToken ?? ''),
            expires_at: expiresAt,
          })

          if (tokenError) {
            console.error('[callback] gmail_tokens insert error:', tokenError.message)
          } else {
            console.log('[callback] Gmail tokens saved for', user.email)
            tokenSaved = true
          }
        } else {
          console.warn('[callback] No provider_token returned from Supabase OAuth')
        }

        // Only show success if we actually stored the token
        if (tokenSaved) {
          // Register Gmail → Pub/Sub watch (background — don't block redirect)
          registerGmailWatch(user.id).catch((e) =>
            console.error('[callback] registerGmailWatch failed:', e)
          )

          // Seed inbox with last 50 messages
          const { data: userRow2 } = await admin
            .from('users')
            .select('business_id')
            .eq('id', user.id)
            .single()

          if (userRow2?.business_id) {
            const { decrypt } = await import('@/lib/utils/crypto')
            const rawToken = decrypt(providerToken!)
            initialSync(rawToken, userRow2.business_id).catch((e) =>
              console.error('[callback] initialSync failed:', e)
            )
          }
        }

        const redirectUrl = new URL(`${origin}/onboarding`)
        if (tokenSaved) {
          redirectUrl.searchParams.set('gmail_connected', 'true')
          redirectUrl.searchParams.set('gmail_email', user.email ?? '')
        } else {
          redirectUrl.searchParams.set('gmail_connected', 'false')
          redirectUrl.searchParams.set('gmail_error', providerToken ? 'save_failed' : 'no_token')
        }
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
