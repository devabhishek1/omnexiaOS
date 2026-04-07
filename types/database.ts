export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Business = {
  id: string
  name: string
  logo_url: string | null
  country_code: string
  vat_number: string | null
  industry: string | null
  size_range: string | null
  locale: string
  timezone: string
  created_at: string
}

export type User = {
  id: string
  business_id: string
  active_business_id: string | null
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'admin' | 'manager' | 'employee' | 'accountant'
  module_access: {
    communications: boolean
    finance: boolean
    planning: boolean
    team: boolean
  }
  status: 'active' | 'on_leave' | 'deactivated'
  created_at: string
}

export type UserBusiness = {
  id: string
  user_id: string
  business_id: string
  role: 'admin' | 'manager' | 'employee' | 'accountant'
  module_access: {
    communications: boolean
    finance: boolean
    planning: boolean
    team: boolean
  } | null
  joined_at: string
  // Joined business data
  business?: Business
}

export type Invoice = {
  id: string
  business_id: string
  client_name: string
  line_items: Array<{ description: string; quantity: number; unit_price: number }>
  subtotal: number
  vat_rate: number
  vat_amount: number
  total: number
  currency: string
  status: 'unpaid' | 'sent' | 'paid' | 'overdue'
  due_date: string
  issued_date: string
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type Message = {
  id: string
  business_id: string
  conversation_id: string
  channel: 'gmail' | 'instagram' | 'facebook'
  gmail_message_id: string | null
  direction: 'inbound' | 'outbound'
  sender_email: string | null
  sender_name: string | null
  subject: string | null
  body_preview: string | null
  body_cached: string | null
  ai_summary: string | null
  ai_extracted: Json | null
  is_read: boolean
  received_at: string | null
  created_at: string
}

export type Notification = {
  id: string
  business_id: string
  user_id: string
  type: 'message' | 'invoice_overdue' | 'time_off' | 'shift_conflict' | 'invite'
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

export type Employee = {
  id: string
  business_id: string
  user_id: string
  full_name: string
  email: string
  phone: string | null
  role_title: string | null
  created_at: string
}

export type Shift = {
  id: string
  business_id: string
  employee_id: string
  date: string
  start_time: string
  end_time: string
  notes: string | null
  created_at: string
}

export type TimeOffRequest = {
  id: string
  business_id: string
  employee_id: string
  start_date: string
  end_date: string
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}
