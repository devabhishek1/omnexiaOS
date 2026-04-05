import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { encrypt } from '@/lib/utils/crypto'
import { registerGmailWatch } from '@/lib/gmail/watch'
import { initialSync } from '@/lib/gmail/sync'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // from=onboarding | from=dashboard | from=settings
  const from = searchParams.get('from') ?? 'login'

  if (!code) {
    console.error('[callback] No code in query params')
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
  }

  const supabase = await createClient()
  const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

  if (sessionError || !sessionData?.session) {
    console.error('[callback] exchangeCodeForSession error:', sessionError?.message)
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
  }

  const { session } = sessionData
  const user = session.user
  const admin = createAdminClient()

  // Always upsert public users row (safe even if business_id doesn't exist yet)
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
  if (upsertError) console.error('[callback] users upsert error:', upsertError.message)

  // ── Gmail connect flow ────────────────────────────────────────────────────
  const isGmailConnect = from === 'onboarding' || from === 'dashboard' || from === 'settings'

  if (isGmailConnect) {
    const providerToken = session.provider_token
    const providerRefreshToken = session.provider_refresh_token

    // Diagnostic: log what Supabase returned so we can see what's happening
    console.log('[callback] provider_token present:', !!providerToken)
    console.log('[callback] provider_refresh_token present:', !!providerRefreshToken)

    if (!providerToken) {
      // provider_token is null — most likely cause: "Save provider tokens" is NOT enabled
      // in Supabase Dashboard → Authentication → Providers → Google
      console.error(
        '[callback] provider_token is null. ' +
        'ACTION REQUIRED: In Supabase Dashboard → Authentication → Providers → Google, ' +
        'enable "Save provider tokens" (or "Extended OAuth tokens"), then re-connect Gmail.'
      )
      return redirectWithError(origin, from, 'no_token')
    }

    // Get business_id for this user
    const { data: userRow } = await admin
      .from('users')
      .select('business_id')
      .eq('id', user.id)
      .single()

    const businessId = userRow?.business_id ?? null

    // DELETE existing token first (clean upsert — avoids unique constraint issues)
    const { error: deleteError } = await admin
      .from('gmail_tokens')
      .delete()
      .eq('user_id', user.id)
    if (deleteError) console.warn('[callback] token delete (non-fatal):', deleteError.message)

    let encryptedAccess: string
    let encryptedRefresh: string
    try {
      encryptedAccess = encrypt(providerToken)
      encryptedRefresh = encrypt(providerRefreshToken ?? '')
    } catch (cryptoErr) {
      console.error('[callback] encrypt failed:', cryptoErr)
      return redirectWithError(origin, from, 'crypto_error')
    }

    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString()
    const { error: tokenError } = await admin.from('gmail_tokens').insert({
      user_id: user.id,
      business_id: businessId,
      email: user.email!,
      access_token: encryptedAccess,
      refresh_token: encryptedRefresh,
      expires_at: expiresAt,
    })

    if (tokenError) {
      console.error('[callback] gmail_tokens insert error:', tokenError.message, tokenError.code)
      return redirectWithError(origin, from, 'save_failed')
    }

    console.log('[callback] Gmail token saved successfully for', user.email)

    // Register Gmail → Pub/Sub watch (background, non-blocking)
    registerGmailWatch(user.id).catch(e =>
      console.error('[callback] registerGmailWatch failed (non-fatal):', e)
    )

    // Seed inbox with last 50 messages (background, non-blocking)
    if (businessId) {
      initialSync(providerToken, businessId).catch(e =>
        console.error('[callback] initialSync failed (non-fatal):', e)
      )
    }

    // Redirect back to where the user came from
    const redirectBase = from === 'onboarding'
      ? `${origin}/onboarding`
      : from === 'settings'
      ? `${origin}/settings?tab=integrations`
      : `${origin}/communications`

    const redirectUrl = new URL(redirectBase)
    redirectUrl.searchParams.set('gmail_connected', 'true')
    redirectUrl.searchParams.set('gmail_email', user.email ?? '')
    return NextResponse.redirect(redirectUrl.toString())
  }

  // ── Normal login flow ─────────────────────────────────────────────────────
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

function redirectWithError(origin: string, from: string, errorCode: string): NextResponse {
  const base = from === 'onboarding'
    ? `${origin}/onboarding`
    : from === 'settings'
    ? `${origin}/settings?tab=integrations`
    : `${origin}/communications`

  const url = new URL(base)
  url.searchParams.set('gmail_connected', 'false')
  url.searchParams.set('gmail_error', errorCode)
  return NextResponse.redirect(url.toString())
}
