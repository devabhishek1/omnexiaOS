-- Phase 07: columns required for Google Pub/Sub Gmail watch
ALTER TABLE public.gmail_tokens
  ADD COLUMN IF NOT EXISTS history_id    text          NULL,
  ADD COLUMN IF NOT EXISTS watch_expiry  timestamptz   NULL,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz  NULL;

-- Required so upsertMessage({ onConflict: 'external_id' }) works on conversations
CREATE UNIQUE INDEX IF NOT EXISTS conversations_external_id_uniq
  ON public.conversations (business_id, external_id)
  WHERE external_id IS NOT NULL;

-- Already in 003, but guard it here too for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS gmail_tokens_user_id_uniq
  ON public.gmail_tokens (user_id);
