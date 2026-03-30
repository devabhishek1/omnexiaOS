/**
 * app/api/gmail/webhook/route.ts
 * Google Pub/Sub push endpoint — called instantly when a new Gmail arrives.
 * Pub/Sub sends a POST with a base64-encoded message containing { emailAddress, historyId }.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getValidAccessToken } from '@/lib/gmail/client'
import { fetchMessagesSinceHistory, upsertMessage } from '@/lib/gmail/sync'
import { parseGmailMessage } from '@/lib/gmail/parse'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Pub/Sub wraps the payload in body.message.data (base64url encoded)
    if (!body?.message?.data) {
      return NextResponse.json({ error: 'Invalid Pub/Sub message' }, { status: 400 })
    }

    const rawData = Buffer.from(body.message.data, 'base64').toString('utf-8')
    const { emailAddress, historyId } = JSON.parse(rawData)

    if (!emailAddress || !historyId) {
      return NextResponse.json({ error: 'Missing emailAddress or historyId' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Find the token row for this email address
    const { data: token } = await admin
      .from('gmail_tokens')
      .select('user_id, history_id, users(business_id)')
      .eq('email', emailAddress)
      .single()

    if (!token) {
      console.warn(`[webhook] No token found for email: ${emailAddress}`)
      // Return 200 so Pub/Sub doesn't keep retrying for an unknown email
      return new Response('OK', { status: 200 })
    }

    const businessId = (token.users as unknown as { business_id: string } | null)?.business_id
    if (!businessId) {
      console.warn(`[webhook] No business_id for user: ${token.user_id}`)
      return new Response('OK', { status: 200 })
    }

    const fromHistoryId = token.history_id ?? historyId

    // Get a valid (possibly refreshed) access token
    const accessToken = await getValidAccessToken(token.user_id)

    // Fetch new messages since the last known historyId
    const newMessages = await fetchMessagesSinceHistory(accessToken, fromHistoryId, historyId)

    for (const msg of newMessages) {
      try {
        const parsed = parseGmailMessage(msg)
        await upsertMessage(parsed, businessId)
      } catch (e) {
        console.error('[webhook] error upserting message:', e)
      }
    }

    // Advance stored historyId to the new one
    await admin
      .from('gmail_tokens')
      .update({
        history_id: historyId,
        last_synced_at: new Date().toISOString(),
      })
      .eq('user_id', token.user_id)

    console.log(
      `[webhook] Processed ${newMessages.length} new messages for ${emailAddress}`
    )
    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('[webhook] Unhandled error:', err)
    // Return 200 to prevent Pub/Sub from retrying and flooding logs
    return new Response('OK', { status: 200 })
  }
}
