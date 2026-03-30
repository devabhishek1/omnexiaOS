-- One Gmail connection per user.
-- Required so that upsert({ onConflict: 'user_id' }) in the OAuth callback
-- updates the existing row instead of inserting duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS gmail_tokens_user_id_uniq
  ON public.gmail_tokens (user_id);
