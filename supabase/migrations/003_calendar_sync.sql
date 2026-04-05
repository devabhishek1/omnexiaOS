-- Migration 003: Add calendar_event_id to shifts and time_off_requests
-- Stores the Google Calendar event ID so we can update/delete events when planning changes.

ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS calendar_event_id text NULL;

ALTER TABLE public.time_off_requests
  ADD COLUMN IF NOT EXISTS calendar_event_id text NULL;
