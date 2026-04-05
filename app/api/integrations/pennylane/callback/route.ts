import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { storePennylaneTokens } from '@/lib/pennylane/sync'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${origin}/settings?tab=integrations&error=pennylane_oauth_failed`)
  }

  const clientId = process.env.PENNYLANE_CLIENT_ID
  const clientSecret = process.env.PENNYLANE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/settings?tab=integrations&error=pennylane_not_configured`)
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://app.pennylane.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/pennylane/callback`,
    }),
  })

  if (!tokenRes.ok) {
    console.error('[pennylane/callback] token exchange failed:', await tokenRes.text())
    return NextResponse.redirect(`${origin}/settings?tab=integrations&error=pennylane_token_failed`)
  }

  const { access_token, refresh_token, expires_in } = await tokenRes.json()

  // Get current user's business_id
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const admin = createAdminClient()
  const { data: userRow } = await admin.from('users').select('business_id').eq('id', user.id).single()
  if (!userRow?.business_id) {
    return NextResponse.redirect(`${origin}/settings?tab=integrations&error=no_business`)
  }

  await storePennylaneTokens(userRow.business_id, access_token, refresh_token, expires_in ?? 3600)

  return NextResponse.redirect(`${origin}/settings?tab=integrations&pennylane_connected=true`)
}
