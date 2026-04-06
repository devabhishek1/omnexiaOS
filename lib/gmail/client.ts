/**
 * lib/gmail/client.ts
 * Provides a valid (non-expired) Gmail access token, refreshing automatically.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { encrypt, decrypt, isEncrypted } from '@/lib/utils/crypto'

export async function getValidAccessToken(userId: string): Promise<string> {
  const admin = createAdminClient()

  const { data: token, error } = await admin
    .from('gmail_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !token) {
    throw new Error(`No Gmail token found for user ${userId}`)
  }

  // Decrypt stored access token (guard against legacy unencrypted tokens)
  const currentAccessToken = isEncrypted(token.access_token)
    ? decrypt(token.access_token)
    : token.access_token

  // If not expired, return as-is
  if (new Date(token.expires_at) > new Date()) {
    return currentAccessToken
  }

  // --- Token expired: refresh ---
  const refreshToken = isEncrypted(token.refresh_token)
    ? decrypt(token.refresh_token)
    : token.refresh_token

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Token refresh failed: ${body}`)
  }

  const { access_token, expires_in } = await res.json()
  const newExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

  // Persist refreshed token (encrypted)
  await admin
    .from('gmail_tokens')
    .update({
      access_token: encrypt(access_token),
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  return access_token
}

/** Returns the gmail_tokens row for a user, or null */
export async function getGmailToken(userId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('gmail_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data
}

/**
 * Returns a valid access token for the business's connected Gmail account.
 * Works for both owners (who have the token) and employees (who don't).
 * Always fetches by business_id so employees can use the owner's Gmail.
 */
export async function getBusinessAccessToken(businessId: string): Promise<string> {
  const admin = createAdminClient()

  const { data: token, error } = await admin
    .from('gmail_tokens')
    .select('*')
    .eq('business_id', businessId)
    .single()

  if (error || !token) {
    throw new Error(`No Gmail token found for business ${businessId}`)
  }

  const currentAccessToken = isEncrypted(token.access_token)
    ? decrypt(token.access_token)
    : token.access_token

  if (new Date(token.expires_at) > new Date()) {
    return currentAccessToken
  }

  // Token expired — refresh
  const refreshToken = isEncrypted(token.refresh_token)
    ? decrypt(token.refresh_token)
    : token.refresh_token

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Token refresh failed: ${body}`)
  }

  const { access_token, expires_in } = await res.json()
  const newExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

  await admin
    .from('gmail_tokens')
    .update({ access_token: encrypt(access_token), expires_at: newExpiresAt })
    .eq('business_id', businessId)

  return access_token
}

/**
 * Returns the Gmail address connected to the business (owner's Gmail).
 * Used for direction correction — works for both owners and employees.
 */
export async function getBusinessGmailEmail(businessId: string): Promise<string> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('gmail_tokens')
    .select('email')
    .eq('business_id', businessId)
    .single()
  return (data?.email ?? '').toLowerCase()
}
