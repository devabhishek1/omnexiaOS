/**
 * app/api/mistral/reply/route.ts
 * Stub endpoint — returns a placeholder AI draft reply.
 * Will be replaced with real Mistral AI in Phase 12.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PLACEHOLDER_DRAFTS = [
  'Thank you for reaching out. I have reviewed your message and will get back to you with a detailed response shortly.',
  'Thank you for your email. I appreciate you bringing this to my attention. I will look into this and follow up with you soon.',
  'Hi, thank you for your message. I have noted your request and will respond with more details within the next business day.',
]

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conversationId } = await request.json()

  // Simulate a brief "thinking" delay (removed in Phase 12 by real AI)
  await new Promise((r) => setTimeout(r, 600))

  const draft = PLACEHOLDER_DRAFTS[Math.floor(Math.random() * PLACEHOLDER_DRAFTS.length)]

  return NextResponse.json({
    draft,
    conversationId,
    model: 'stub', // replaced with 'mistral-large' in Phase 12
  })
}
