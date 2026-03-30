/**
 * lib/gmail/auth.ts
 * Google OAuth URL generation for Gmail connect flow.
 */

export function getGoogleAuthUrl(userId: string, from: string = 'onboarding'): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/contacts.readonly',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: userId,
  })

  // Pass `from` so the callback knows this is a Gmail connect (not a login)
  params.set('from', from)

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}
