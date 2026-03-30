/**
 * lib/gmail/watch.ts
 * Registers (and renews) a Gmail inbox watch with Google Pub/Sub.
 * Pub/Sub will push to /api/gmail/webhook whenever a new email arrives.
 *
 * Watch expires every 7 days — call renewExpiringWatches() daily via cron.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { getValidAccessToken } from './client'

export async function registerGmailWatch(userId: string): Promise<void> {
  const admin = createAdminClient()

  const accessToken = await getValidAccessToken(userId)

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/watch', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topicName: process.env.GOOGLE_PUBSUB_TOPIC,
      labelIds: ['INBOX'],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[gmail/watch] watch registration failed:', err)
    // Don't throw — initial sync can still work without Pub/Sub
    return
  }

  const { historyId, expiration } = await res.json()

  await admin
    .from('gmail_tokens')
    .update({
      history_id: historyId,
      watch_expiry: new Date(parseInt(expiration)).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  console.log(`[gmail/watch] Registered watch for user ${userId}, historyId=${historyId}`)
}

/** Call this daily — renews watches expiring within 24 hours */
export async function renewExpiringWatches(): Promise<void> {
  const admin = createAdminClient()
  const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { data: tokens } = await admin
    .from('gmail_tokens')
    .select('user_id')
    .lt('watch_expiry', in24h)

  for (const token of tokens ?? []) {
    try {
      await registerGmailWatch(token.user_id)
    } catch (e) {
      console.error(`[gmail/watch] Failed to renew for ${token.user_id}:`, e)
    }
  }
}
