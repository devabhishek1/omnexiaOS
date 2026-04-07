-- Add is_archived and folder columns to conversations
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS folder      text    NOT NULL DEFAULT 'inbox';
