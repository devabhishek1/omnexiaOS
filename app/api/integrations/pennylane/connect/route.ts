import { NextResponse } from 'next/server'

// Pennylane OAuth 2.0 initiation
// Docs: https://app.pennylane.com/developer/docs
// Set PENNYLANE_CLIENT_ID in .env.local once you have a Pennylane developer account

export async function GET() {
  const clientId = process.env.PENNYLANE_CLIENT_ID

  if (!clientId) {
    // Redirect to settings with an informative message if not configured
    return NextResponse.redirect(new URL('/settings?tab=integrations&error=pennylane_not_configured', process.env.NEXT_PUBLIC_APP_URL!))
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/pennylane/callback`
  const scopes = 'invoices:read invoices:write'

  const authUrl = new URL('https://app.pennylane.com/oauth/authorize')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', scopes)

  return NextResponse.redirect(authUrl.toString())
}
