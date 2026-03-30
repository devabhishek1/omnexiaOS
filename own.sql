create table public.users (
  id uuid not null,
  business_id uuid null,
  email text not null,
  full_name text null,
  avatar_url text null,
  role text not null default 'admin'::text,
  module_access jsonb null default '{"team": true, "finance": true, "planning": true, "communications": true}'::jsonb,
  status text null default 'active'::text,
  locale text null default 'en'::text,
  onboarding_complete boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint users_pkey primary key (id),
  constraint users_business_id_fkey foreign KEY (business_id) references businesses (id) on delete set null,
  constraint users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.time_off_requests (
  id uuid not null default gen_random_uuid (),
  business_id uuid null,
  employee_id uuid null,
  start_date date not null,
  end_date date not null,
  reason text null,
  status text null default 'pending'::text,
  reviewed_by uuid null,
  reviewed_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint time_off_requests_pkey primary key (id),
  constraint time_off_requests_business_id_fkey foreign KEY (business_id) references businesses (id) on delete CASCADE,
  constraint time_off_requests_employee_id_fkey foreign KEY (employee_id) references employees (id) on delete CASCADE,
  constraint time_off_requests_reviewed_by_fkey foreign KEY (reviewed_by) references users (id) on delete set null
) TABLESPACE pg_default;
create table public.social_tokens (
  id uuid not null default gen_random_uuid (),
  business_id uuid null,
  channel text not null,
  status text null default 'not_connected'::text,
  created_at timestamp with time zone null default now(),
  constraint social_tokens_pkey primary key (id),
  constraint social_tokens_business_id_fkey foreign KEY (business_id) references businesses (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.shifts (
  id uuid not null default gen_random_uuid (),
  business_id uuid null,
  employee_id uuid null,
  date date not null,
  start_time time without time zone not null,
  end_time time without time zone not null,
  notes text null,
  created_at timestamp with time zone null default now(),
  constraint shifts_pkey primary key (id),
  constraint shifts_business_id_fkey foreign KEY (business_id) references businesses (id) on delete CASCADE,
  constraint shifts_employee_id_fkey foreign KEY (employee_id) references employees (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.public_holidays (
  id uuid not null default gen_random_uuid (),
  country_code character(2) not null,
  date date not null,
  name text not null,
  constraint public_holidays_pkey primary key (id),
  constraint public_holidays_country_code_date_key unique (country_code, date)
) TABLESPACE pg_default;

create table public.notifications (
  id uuid not null default gen_random_uuid (),
  business_id uuid null,
  user_id uuid null,
  type text not null,
  title text not null,
  body text null,
  link text null,
  is_read boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint notifications_pkey primary key (id),
  constraint notifications_business_id_fkey foreign KEY (business_id) references businesses (id) on delete CASCADE,
  constraint notifications_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.messages (
  id uuid not null default gen_random_uuid (),
  business_id uuid null,
  conversation_id uuid null,
  channel text not null default 'gmail'::text,
  gmail_message_id text null,
  direction text not null default 'inbound'::text,
  sender_email text null,
  sender_name text null,
  subject text null,
  body_preview text null,
  body_cached text null,
  ai_summary text null,
  ai_extracted jsonb null,
  is_read boolean null default false,
  received_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint messages_pkey primary key (id),
  constraint messages_business_id_fkey foreign KEY (business_id) references businesses (id) on delete CASCADE,
  constraint messages_conversation_id_fkey foreign KEY (conversation_id) references conversations (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.invoices (
  id uuid not null default gen_random_uuid (),
  business_id uuid null,
  client_name text not null,
  line_items jsonb not null default '[]'::jsonb,
  subtotal numeric(10, 2) null default 0,
  vat_rate numeric(5, 2) null default 20,
  vat_amount numeric(10, 2) null default 0,
  total numeric(10, 2) null default 0,
  currency character(3) null default 'EUR'::bpchar,
  status text null default 'unpaid'::text,
  due_date date null,
  issued_date date null default CURRENT_DATE,
  notes text null,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint invoices_pkey primary key (id),
  constraint invoices_business_id_fkey foreign KEY (business_id) references businesses (id) on delete CASCADE,
  constraint invoices_created_by_fkey foreign KEY (created_by) references users (id) on delete set null
) TABLESPACE pg_default;

create table public.gmail_tokens (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  business_id uuid null,
  email text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamp with time zone not null,
  last_polled_at timestamp with time zone null,
  calendar_connected boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint gmail_tokens_pkey primary key (id),
  constraint gmail_tokens_business_id_fkey foreign KEY (business_id) references businesses (id) on delete CASCADE,
  constraint gmail_tokens_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.expenses (
  id uuid not null default gen_random_uuid (),
  business_id uuid null,
  description text not null,
  amount numeric(10, 2) not null,
  currency character(3) null default 'EUR'::bpchar,
  category text null default 'Other'::text,
  receipt_url text null,
  date date not null default CURRENT_DATE,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  constraint expenses_pkey primary key (id),
  constraint expenses_business_id_fkey foreign KEY (business_id) references businesses (id) on delete CASCADE,
  constraint expenses_created_by_fkey foreign KEY (created_by) references users (id) on delete set null
) TABLESPACE pg_default;

create table public.employees (
  id uuid not null default gen_random_uuid (),
  business_id uuid null,
  user_id uuid null,
  full_name text not null,
  email text not null,
  phone text null,
  role_title text null,
  created_at timestamp with time zone null default now(),
  constraint employees_pkey primary key (id),
  constraint employees_business_id_fkey foreign KEY (business_id) references businesses (id) on delete CASCADE,
  constraint employees_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.conversations (
  id uuid not null default gen_random_uuid (),
  business_id uuid null,
  channel text not null default 'gmail'::text,
  external_id text null,
  participant_email text null,
  participant_name text null,
  subject text null,
  status text null default 'unread'::text,
  priority boolean null default false,
  assigned_to uuid null,
  labels text[] null default '{}'::text[],
  last_message_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint conversations_pkey primary key (id),
  constraint conversations_assigned_to_fkey foreign KEY (assigned_to) references users (id) on delete set null,
  constraint conversations_business_id_fkey foreign KEY (business_id) references businesses (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.businesses (
  id uuid not null default gen_random_uuid (),
  name text not null,
  logo_url text null,
  country_code character(2) not null default 'EU'::bpchar,
  vat_number text null,
  industry text null,
  size_range text null,
  locale text not null default 'en'::text,
  timezone text not null default 'Europe/Paris'::text,
  created_at timestamp with time zone null default now(),
  constraint businesses_pkey primary key (id)
) TABLESPACE pg_default;

create table public.ai_digests (
  id uuid not null default gen_random_uuid (),
  business_id uuid null,
  date date not null,
  content text not null,
  message_count integer null default 0,
  urgent_count integer null default 0,
  generated_at timestamp with time zone null default now(),
  constraint ai_digests_pkey primary key (id),
  constraint ai_digests_business_id_date_key unique (business_id, date),
  constraint ai_digests_business_id_fkey foreign KEY (business_id) references businesses (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.activity_logs (
  id uuid not null default gen_random_uuid (),
  business_id uuid null,
  user_id uuid null,
  action text not null,
  target_type text null,
  target_id uuid null,
  metadata jsonb null,
  created_at timestamp with time zone null default now(),
  constraint activity_logs_pkey primary key (id),
  constraint activity_logs_business_id_fkey foreign KEY (business_id) references businesses (id) on delete CASCADE,
  constraint activity_logs_user_id_fkey foreign KEY (user_id) references users (id) on delete set null
) TABLESPACE pg_default;