-- =============================================================================
-- OMNEXIA — COMPLETE SUPABASE SCHEMA (live snapshot 2026-03-31)
-- Project: NodaOS Project (cuioqoveyxuqnxagdolq) — eu-central-1
--
-- Includes:
--   1. Helper function (get_user_business_id)
--   2. All 16 tables in dependency order
--   3. All RLS policies (Row Level Security)
--   4. Auth trigger (handle_new_user)
--   5. Realtime publication membership
--
-- NOTE: gmail_tokens has 3 extra columns added post-phase-07:
--   history_id, watch_expiry, last_synced_at
-- NOTE: invoices has 3 extra columns added in phase-08:
--   source, external_id, client_email
-- NOTE: integrations table added in phase-08 (Pennylane)
-- =============================================================================


-- ---------------------------------------------------------------------------
-- HELPER FUNCTION
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT business_id FROM users WHERE id = auth.uid()
$$;


-- ---------------------------------------------------------------------------
-- TABLE: businesses  (no FK deps — create first)
-- ---------------------------------------------------------------------------

CREATE TABLE public.businesses (
  id           uuid NOT NULL DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  logo_url     text NULL,
  country_code char(2) NOT NULL DEFAULT 'EU',
  vat_number   text NULL,
  industry     text NULL,
  size_range   text NULL,
  locale       text NOT NULL DEFAULT 'en',
  timezone     text NOT NULL DEFAULT 'Europe/Paris',
  created_at   timestamptz NULL DEFAULT now(),
  CONSTRAINT businesses_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY businesses_insert ON public.businesses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY businesses_select_update_delete ON public.businesses
  FOR ALL USING (id = get_user_business_id());


-- ---------------------------------------------------------------------------
-- TABLE: users  (depends on businesses + auth.users)
-- ---------------------------------------------------------------------------

CREATE TABLE public.users (
  id                 uuid NOT NULL,
  business_id        uuid NULL,
  email              text NOT NULL,
  full_name          text NULL,
  avatar_url         text NULL,
  role               text NOT NULL DEFAULT 'admin',
  module_access      jsonb NULL DEFAULT '{"team": true, "finance": true, "planning": true, "communications": true}'::jsonb,
  status             text NULL DEFAULT 'active',
  locale             text NULL DEFAULT 'en',
  onboarding_complete boolean NULL DEFAULT false,
  created_at         timestamptz NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE SET NULL,
  CONSTRAINT users_id_fkey          FOREIGN KEY (id)          REFERENCES auth.users (id)  ON DELETE CASCADE
) TABLESPACE pg_default;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY same_business_users ON public.users
  FOR ALL USING (business_id = get_user_business_id());

CREATE POLICY users_insert_own ON public.users
  FOR INSERT WITH CHECK ((id = auth.uid()) OR (auth.uid() IS NOT NULL));


-- ---------------------------------------------------------------------------
-- TABLE: employees  (depends on businesses, users)
-- ---------------------------------------------------------------------------

CREATE TABLE public.employees (
  id            uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id   uuid NULL,
  user_id       uuid NULL,
  full_name     text NOT NULL,
  email         text NOT NULL,
  phone         text NULL,
  role_title    text NULL,
  status        text NULL DEFAULT 'invited',
  module_access jsonb NULL DEFAULT NULL,
  created_at    timestamptz NULL DEFAULT now(),
  CONSTRAINT employees_pkey            PRIMARY KEY (id),
  CONSTRAINT employees_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
  CONSTRAINT employees_user_id_fkey     FOREIGN KEY (user_id)      REFERENCES users (id)      ON DELETE CASCADE
) TABLESPACE pg_default;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_employees ON public.employees
  FOR ALL USING (business_id = get_user_business_id());


-- ---------------------------------------------------------------------------
-- TABLE: conversations  (depends on businesses, users)
-- ---------------------------------------------------------------------------

CREATE TABLE public.conversations (
  id                uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id       uuid NULL,
  channel           text NOT NULL DEFAULT 'gmail',
  external_id       text NULL,
  participant_email text NULL,
  participant_name  text NULL,
  subject           text NULL,
  status            text NULL DEFAULT 'unread',
  priority          boolean NULL DEFAULT false,
  assigned_to       uuid NULL,
  labels            text[] NULL DEFAULT '{}',
  last_message_at   timestamptz NULL,
  created_at        timestamptz NULL DEFAULT now(),
  CONSTRAINT conversations_pkey            PRIMARY KEY (id),
  CONSTRAINT conversations_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
  CONSTRAINT conversations_assigned_to_fkey FOREIGN KEY (assigned_to)  REFERENCES users (id)      ON DELETE SET NULL
) TABLESPACE pg_default;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_conversations ON public.conversations
  FOR ALL USING (business_id = get_user_business_id());


-- ---------------------------------------------------------------------------
-- TABLE: messages  (depends on businesses, conversations)
-- ---------------------------------------------------------------------------

CREATE TABLE public.messages (
  id               uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id      uuid NULL,
  conversation_id  uuid NULL,
  channel          text NOT NULL DEFAULT 'gmail',
  gmail_message_id text NULL,
  direction        text NOT NULL DEFAULT 'inbound',
  sender_email     text NULL,
  sender_name      text NULL,
  subject          text NULL,
  body_preview     text NULL,
  body_cached      text NULL,
  ai_summary       text NULL,
  ai_extracted     jsonb NULL,
  is_read          boolean NULL DEFAULT false,
  received_at      timestamptz NULL,
  created_at       timestamptz NULL DEFAULT now(),
  CONSTRAINT messages_pkey                PRIMARY KEY (id),
  CONSTRAINT messages_business_id_fkey     FOREIGN KEY (business_id)     REFERENCES businesses   (id) ON DELETE CASCADE,
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
) TABLESPACE pg_default;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_messages ON public.messages
  FOR ALL USING (business_id = get_user_business_id());


-- ---------------------------------------------------------------------------
-- TABLE: gmail_tokens  (depends on businesses, users)
-- ---------------------------------------------------------------------------

CREATE TABLE public.gmail_tokens (
  id               uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id          uuid NULL,
  business_id      uuid NULL,
  email            text NOT NULL,
  access_token     text NOT NULL,          -- AES-256-GCM encrypted: iv:tag:ciphertext
  refresh_token    text NOT NULL,          -- AES-256-GCM encrypted
  expires_at       timestamptz NOT NULL,
  last_polled_at   timestamptz NULL,
  calendar_connected boolean NULL DEFAULT false,
  created_at       timestamptz NULL DEFAULT now(),
  updated_at       timestamptz NULL DEFAULT now(),
  history_id       text NULL,              -- Gmail history ID for incremental sync
  watch_expiry     timestamptz NULL,       -- Pub/Sub watch expiry
  last_synced_at   timestamptz NULL,
  CONSTRAINT gmail_tokens_pkey            PRIMARY KEY (id),
  CONSTRAINT gmail_tokens_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
  CONSTRAINT gmail_tokens_user_id_fkey     FOREIGN KEY (user_id)      REFERENCES users (id)      ON DELETE CASCADE
) TABLESPACE pg_default;

ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;

-- Each user can only access their own token (NOT business-scoped — avoids null business_id issues)
CREATE POLICY user_own_gmail_token ON public.gmail_tokens
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- TABLE: integrations  (depends on businesses)  — Pennylane + future providers
-- ---------------------------------------------------------------------------

CREATE TABLE public.integrations (
  id             uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id    uuid NULL,
  provider       text NOT NULL,                 -- e.g. 'pennylane'
  access_token   text NULL,                     -- AES-256-GCM encrypted
  refresh_token  text NULL,                     -- AES-256-GCM encrypted
  expires_at     timestamptz NULL,
  last_synced_at timestamptz NULL,
  status         text NOT NULL DEFAULT 'connected',
  created_at     timestamptz NULL DEFAULT now(),
  CONSTRAINT integrations_pkey                    PRIMARY KEY (id),
  CONSTRAINT integrations_business_id_fkey         FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
  CONSTRAINT integrations_business_id_provider_key UNIQUE (business_id, provider)
) TABLESPACE pg_default;

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_integrations ON public.integrations
  FOR ALL USING (business_id IN (SELECT users.business_id FROM users WHERE users.id = auth.uid()));


-- ---------------------------------------------------------------------------
-- TABLE: invoices  (depends on businesses, users)
-- ---------------------------------------------------------------------------

CREATE TABLE public.invoices (
  id           uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id  uuid NULL,
  client_name  text NOT NULL,
  client_email text NULL,
  line_items   jsonb NOT NULL DEFAULT '[]',
  subtotal     numeric(10,2) NULL DEFAULT 0,
  vat_rate     numeric(5,2)  NULL DEFAULT 20,
  vat_amount   numeric(10,2) NULL DEFAULT 0,
  total        numeric(10,2) NULL DEFAULT 0,
  currency     char(3) NULL DEFAULT 'EUR',
  status       text NULL DEFAULT 'unpaid',
  due_date     date NULL,
  issued_date  date NULL DEFAULT CURRENT_DATE,
  notes        text NULL,
  source       text NOT NULL DEFAULT 'native',   -- 'native' | 'pennylane'
  external_id  text NULL,                         -- Pennylane invoice ID
  created_by   uuid NULL,
  created_at   timestamptz NULL DEFAULT now(),
  updated_at   timestamptz NULL DEFAULT now(),
  CONSTRAINT invoices_pkey            PRIMARY KEY (id),
  CONSTRAINT invoices_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
  CONSTRAINT invoices_created_by_fkey  FOREIGN KEY (created_by)   REFERENCES users (id)      ON DELETE SET NULL
) TABLESPACE pg_default;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_invoices ON public.invoices
  FOR ALL USING (business_id = get_user_business_id());


-- ---------------------------------------------------------------------------
-- TABLE: expenses  (depends on businesses, users)
-- ---------------------------------------------------------------------------

CREATE TABLE public.expenses (
  id          uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NULL,
  description text NOT NULL,
  amount      numeric(10,2) NOT NULL,
  currency    char(3) NULL DEFAULT 'EUR',
  category    text NULL DEFAULT 'Other',
  receipt_url text NULL,
  date        date NOT NULL DEFAULT CURRENT_DATE,
  created_by  uuid NULL,
  created_at  timestamptz NULL DEFAULT now(),
  CONSTRAINT expenses_pkey            PRIMARY KEY (id),
  CONSTRAINT expenses_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
  CONSTRAINT expenses_created_by_fkey  FOREIGN KEY (created_by)   REFERENCES users (id)      ON DELETE SET NULL
) TABLESPACE pg_default;

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_expenses ON public.expenses
  FOR ALL USING (business_id = get_user_business_id());


-- ---------------------------------------------------------------------------
-- TABLE: shifts  (depends on businesses, employees)
-- ---------------------------------------------------------------------------

CREATE TABLE public.shifts (
  id                uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id       uuid NULL,
  employee_id       uuid NULL,
  date              date NOT NULL,
  start_time        time NOT NULL,
  end_time          time NOT NULL,
  notes             text NULL,
  calendar_event_id text NULL,
  created_at        timestamptz NULL DEFAULT now(),
  CONSTRAINT shifts_pkey            PRIMARY KEY (id),
  CONSTRAINT shifts_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
  CONSTRAINT shifts_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
) TABLESPACE pg_default;

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_shifts ON public.shifts
  FOR ALL USING (business_id = get_user_business_id());


-- ---------------------------------------------------------------------------
-- TABLE: time_off_requests  (depends on businesses, employees, users)
-- ---------------------------------------------------------------------------

CREATE TABLE public.time_off_requests (
  id                uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id       uuid NULL,
  employee_id       uuid NULL,
  start_date        date NOT NULL,
  end_date          date NOT NULL,
  reason            text NULL,
  status            text NULL DEFAULT 'pending',
  reviewed_by       uuid NULL,
  reviewed_at       timestamptz NULL,
  calendar_event_id text NULL,
  created_at        timestamptz NULL DEFAULT now(),
  CONSTRAINT time_off_requests_pkey            PRIMARY KEY (id),
  CONSTRAINT time_off_requests_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
  CONSTRAINT time_off_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees (id)  ON DELETE CASCADE,
  CONSTRAINT time_off_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES users (id)      ON DELETE SET NULL
) TABLESPACE pg_default;

ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_time_off ON public.time_off_requests
  FOR ALL USING (business_id = get_user_business_id());


-- ---------------------------------------------------------------------------
-- TABLE: notifications  (depends on businesses, users)
-- ---------------------------------------------------------------------------

CREATE TABLE public.notifications (
  id          uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NULL,
  user_id     uuid NULL,
  type        text NOT NULL,
  title       text NOT NULL,
  body        text NULL,
  link        text NULL,
  is_read     boolean NULL DEFAULT false,
  created_at  timestamptz NULL DEFAULT now(),
  CONSTRAINT notifications_pkey            PRIMARY KEY (id),
  CONSTRAINT notifications_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
  CONSTRAINT notifications_user_id_fkey     FOREIGN KEY (user_id)      REFERENCES users (id)      ON DELETE CASCADE
) TABLESPACE pg_default;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_notifications ON public.notifications
  FOR ALL USING (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- TABLE: activity_logs  (depends on businesses, users)
-- ---------------------------------------------------------------------------

CREATE TABLE public.activity_logs (
  id          uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NULL,
  user_id     uuid NULL,
  action      text NOT NULL,
  target_type text NULL,
  target_id   uuid NULL,
  metadata    jsonb NULL,
  created_at  timestamptz NULL DEFAULT now(),
  CONSTRAINT activity_logs_pkey            PRIMARY KEY (id),
  CONSTRAINT activity_logs_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
  CONSTRAINT activity_logs_user_id_fkey     FOREIGN KEY (user_id)      REFERENCES users (id)      ON DELETE SET NULL
) TABLESPACE pg_default;

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_activity ON public.activity_logs
  FOR ALL USING (business_id = get_user_business_id());


-- ---------------------------------------------------------------------------
-- TABLE: ai_digests  (depends on businesses)
-- ---------------------------------------------------------------------------

CREATE TABLE public.ai_digests (
  id            uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id   uuid NULL,
  date          date NOT NULL,
  content       text NOT NULL,
  message_count int NULL DEFAULT 0,
  urgent_count  int NULL DEFAULT 0,
  generated_at  timestamptz NULL DEFAULT now(),
  CONSTRAINT ai_digests_pkey                 PRIMARY KEY (id),
  CONSTRAINT ai_digests_business_id_fkey      FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
  CONSTRAINT ai_digests_business_id_date_key  UNIQUE (business_id, date)
) TABLESPACE pg_default;

ALTER TABLE public.ai_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_digests ON public.ai_digests
  FOR ALL USING (business_id = get_user_business_id());


-- ---------------------------------------------------------------------------
-- TABLE: public_holidays  (no tenant FK — shared global data)
-- ---------------------------------------------------------------------------

CREATE TABLE public.public_holidays (
  id           uuid NOT NULL DEFAULT gen_random_uuid(),
  country_code char(2) NOT NULL,
  date         date NOT NULL,
  name         text NOT NULL,
  CONSTRAINT public_holidays_pkey              PRIMARY KEY (id),
  CONSTRAINT public_holidays_country_code_date_key UNIQUE (country_code, date)
) TABLESPACE pg_default;

ALTER TABLE public.public_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY read_holidays ON public.public_holidays
  FOR SELECT USING (auth.uid() IS NOT NULL);


-- ---------------------------------------------------------------------------
-- TABLE: social_tokens  (depends on businesses) — placeholder, v1 unused
-- ---------------------------------------------------------------------------

CREATE TABLE public.social_tokens (
  id          uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NULL,
  channel     text NOT NULL,
  status      text NULL DEFAULT 'not_connected',
  created_at  timestamptz NULL DEFAULT now(),
  CONSTRAINT social_tokens_pkey            PRIMARY KEY (id),
  CONSTRAINT social_tokens_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE
) TABLESPACE pg_default;

ALTER TABLE public.social_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_social ON public.social_tokens
  FOR ALL USING (business_id = get_user_business_id());


-- ---------------------------------------------------------------------------
-- AUTH TRIGGER — auto-create users row on signup
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop + recreate trigger so this file is idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ---------------------------------------------------------------------------
-- REALTIME — tables subscribed to supabase_realtime publication
-- (12 tables; gmail_tokens, businesses, public_holidays, social_tokens excluded)
-- ---------------------------------------------------------------------------

ALTER PUBLICATION supabase_realtime ADD TABLE
  public.activity_logs,
  public.ai_digests,
  public.conversations,
  public.employees,
  public.expenses,
  public.integrations,
  public.invoices,
  public.messages,
  public.notifications,
  public.shifts,
  public.time_off_requests,
  public.users;
