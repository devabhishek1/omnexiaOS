-- Omnexia — Initial Schema
-- Phase 01: Full database schema with RLS

-- Core business entity
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  country_code CHAR(2) NOT NULL,         -- ISO 3166-1 alpha-2
  vat_number TEXT,
  industry TEXT,
  size_range TEXT,                        -- '1-10', '11-50', '51-100'
  locale TEXT NOT NULL DEFAULT 'en',     -- next-intl locale
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (linked to Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  business_id UUID REFERENCES businesses(id),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'employee',  -- 'admin' | 'manager' | 'employee' | 'accountant'
  module_access JSONB DEFAULT '{"communications": true, "finance": false, "planning": true, "team": false}',
  status TEXT DEFAULT 'active',           -- 'active' | 'on_leave' | 'deactivated'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gmail OAuth tokens (encrypted)
CREATE TABLE gmail_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id),
  email TEXT NOT NULL,                    -- connected Gmail address
  access_token TEXT NOT NULL,            -- encrypted at rest
  refresh_token TEXT NOT NULL,           -- encrypted at rest
  expires_at TIMESTAMPTZ NOT NULL,
  calendar_connected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations (thread containers)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  channel TEXT NOT NULL DEFAULT 'gmail', -- 'gmail' | 'instagram' | 'facebook'
  external_id TEXT,                       -- Gmail thread ID
  participant_email TEXT,
  participant_name TEXT,
  subject TEXT,
  status TEXT DEFAULT 'unread',          -- 'unread' | 'read' | 'replied' | 'pending'
  priority BOOLEAN DEFAULT FALSE,        -- AI-flagged urgent
  assigned_to UUID REFERENCES users(id),
  labels TEXT[] DEFAULT '{}',
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual messages within conversations
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  conversation_id UUID REFERENCES conversations(id),
  channel TEXT NOT NULL DEFAULT 'gmail',
  gmail_message_id TEXT,                 -- Gmail API message ID
  direction TEXT NOT NULL,               -- 'inbound' | 'outbound'
  sender_email TEXT,
  sender_name TEXT,
  subject TEXT,
  body_preview TEXT,                     -- First 200 chars
  body_cached TEXT,                      -- Full body (recent messages only)
  ai_summary TEXT,                       -- Gemini-extracted summary
  ai_extracted JSONB,                    -- Extracted entities (amounts, dates, names)
  is_read BOOLEAN DEFAULT FALSE,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI daily digests
CREATE TABLE ai_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  date DATE NOT NULL,
  content TEXT NOT NULL,                 -- Full digest text
  message_count INT,
  urgent_count INT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, date)
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  client_name TEXT NOT NULL,
  line_items JSONB NOT NULL,             -- [{description, quantity, unit_price}]
  subtotal DECIMAL(10,2),
  vat_rate DECIMAL(5,2),
  vat_amount DECIMAL(10,2),
  total DECIMAL(10,2),
  currency CHAR(3) DEFAULT 'EUR',
  status TEXT DEFAULT 'unpaid',          -- 'unpaid' | 'sent' | 'paid' | 'overdue'
  due_date DATE,
  issued_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) DEFAULT 'EUR',
  category TEXT,
  receipt_url TEXT,
  date DATE NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees (HR profile, separate from users auth record)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  user_id UUID REFERENCES users(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role_title TEXT,                       -- Display role (e.g. "Commercial", "Designer")
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shifts
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  employee_id UUID REFERENCES employees(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time-off requests
CREATE TABLE time_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  employee_id UUID REFERENCES employees(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',         -- 'pending' | 'approved' | 'rejected'
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL,                    -- 'message' | 'invoice_overdue' | 'time_off' | 'shift_conflict' | 'invite'
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,                             -- Route to navigate on click
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,                  -- e.g. 'invoice.created', 'shift.updated'
  target_type TEXT,                      -- 'invoice' | 'employee' | 'shift' etc.
  target_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public holidays (seeded, not per-business)
CREATE TABLE public_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code CHAR(2) NOT NULL,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  UNIQUE(country_code, date)
);

-- Social channel placeholders (schema ready for v1.5)
CREATE TABLE social_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  channel TEXT NOT NULL,                 -- 'instagram' | 'facebook'
  status TEXT DEFAULT 'not_connected',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security Policies

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_tokens ENABLE ROW LEVEL SECURITY;

-- Business isolation policy (repeated pattern for all tables)
CREATE POLICY "business_isolation" ON businesses
  FOR ALL USING (
    id = (SELECT business_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "business_isolation" ON users
  FOR ALL USING (
    business_id = (SELECT business_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "business_isolation" ON gmail_tokens
  FOR ALL USING (
    business_id = (SELECT business_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "business_isolation" ON conversations
  FOR ALL USING (
    business_id = (SELECT business_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "business_isolation" ON messages
  FOR ALL USING (
    business_id = (SELECT business_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "business_isolation" ON ai_digests
  FOR ALL USING (
    business_id = (SELECT business_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "business_isolation" ON invoices
  FOR ALL USING (
    business_id = (SELECT business_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "business_isolation" ON expenses
  FOR ALL USING (
    business_id = (SELECT business_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "business_isolation" ON employees
  FOR ALL USING (
    business_id = (SELECT business_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "business_isolation" ON shifts
  FOR ALL USING (
    business_id = (SELECT business_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "business_isolation" ON time_off_requests
  FOR ALL USING (
    business_id = (SELECT business_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "business_isolation" ON notifications
  FOR ALL USING (
    business_id = (SELECT business_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "business_isolation" ON activity_logs
  FOR ALL USING (
    business_id = (SELECT business_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "business_isolation" ON social_tokens
  FOR ALL USING (
    business_id = (SELECT business_id FROM users WHERE id = auth.uid())
  );
