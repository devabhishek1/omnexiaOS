# Omnexia — Product & Feature Specification
**Version:** 1.0 | **Status:** Locked

---

## 1. Product Definition

**Omnexia** is a Business OS for European SMBs — a single subscription replacing the fragmented stack of communication tools, finance software, HR schedulers, and team management apps that small businesses currently cobble together.

**Target customer:** European SMBs, 5–100 employees. E-commerce, agencies, consulting firms, physical stores with digital presence. NOT solopreneurs. NOT enterprises.

**Core promise:** Everything your business runs on, in one place. Built for Europe.

**Working name:** Omnexia

---

## 2. Auth

### Signup / Login
- Email + password
- Google OAuth (one-click, also initiates Gmail connection)
- Password reset via email (Resend)

### Session Management
- JWT tokens via Supabase Auth
- Refresh token rotation enabled
- Sessions persist across browser closes

---

## 3. Onboarding Wizard

Sequential multi-step wizard. Progress bar visible throughout. Skip buttons shown on optional steps.

| Step | Screen | Required |
|---|---|---|
| 1 | Welcome — auto-detect browser language, confirm or change | No (auto) |
| 2 | Business name + logo upload | Name ✅ — Logo ⬜ |
| 3 | Country/region selection → sets UI language, VAT format, currency | ✅ |
| 4 | Industry type (e-commerce / agency / consulting / retail / other) | ⬜ |
| 5 | Company size (1–10 / 11–50 / 51–100) | ⬜ |
| 6 | Connect Gmail account (Google OAuth) | ✅ |
| 7 | Choose which modules to activate (all on by default) | ⬜ |
| 8 | Invite first team members by email | ⬜ |
| 9 | Done screen → enter dashboard | — |

**Locale logic:** Step 3 country selection sets:
- UI language (FR / EN / DE / ES / IT / NL)
- VAT number format validation
- Invoice currency (€ for all EU)
- Public holiday calendar

All onboarding settings are editable later in Settings.

---

## 4. Overview Page (Dashboard Home)

Shown immediately after onboarding. The command centre of the app.

### Layout (top to bottom)
1. **Notification/alert strip** — urgent items surfaced by AI (overdue invoices, urgent messages, shift conflicts). Dismissible per item.
2. **AI Digest Card** — dark card, full width. Auto-generated every morning at 7am (business timezone) via cron. Shows: message summary, key flags, pending actions. "Regenerate" button available.
3. **4 Stat Cards** (horizontal row):
   - Unread messages (with delta vs yesterday)
   - Pending invoices (total € value)
   - Active employees (with how many on leave)
   - Daily tasks / urgent flags
4. **Quick Action Buttons** — Compose Message, Create Invoice
5. **Two-column row:**
   - Left: Latest Messages panel (last 5 cross-channel, click to open in Communications)
   - Right: Finance Snapshot (revenue / expenses / net for current month)
6. **Who's In Today** — compact row of employee avatars, green = in / amber = partial / grey = off

---

## 5. Communications Module

The unified inbox. Core module of the product.

### Layout
- **Left panel:** Conversation list (scrollable)
- **Right panel:** Full thread view of selected conversation
- **Top bar:** Channel filter tabs (All / Gmail / Instagram* / Facebook*) + Search + Compose button
- **Sub-filters:** Unread / Read / Replied / Pending + Priority toggle

*Instagram and Facebook tabs visible but show "Coming soon" in v1. Schema ready.

### Conversation List (left panel)
Each item shows: channel badge, sender name, subject/preview, timestamp, unread dot, assigned-to avatar if assigned, label chips.

### Thread View (right panel)
- Full email thread rendered
- Sender info, timestamps
- Assign to team member (dropdown)
- Add label / tag
- Mark as read/unread
- **AI Reply Panel** — auto-appears when opening an unread conversation:
  - Gemini 2.5 Pro generates a draft reply in the business's language
  - User can edit inline
  - Send button fires Gmail API send
  - "Regenerate" option available
  - Dismissible if user wants to write manually

### Priority Inbox
- Gemini flags urgent messages on each poll cycle
- Priority messages shown at top of conversation list with a visual indicator
- Urgency criteria: invoice-related, complaint keywords, time-sensitive language

### Compose New Message
- Modal: To field, Subject, Body
- Sends via Gmail API
- Saved to messages table as sent

---

## 6. Finance Module

### Layout (top to bottom)
1. **Monthly KPI Bar** — Revenue / Expenses / Net Profit for current month. Toggle to view previous months.
2. **Two-column row:**
   - Left: Revenue vs Expenses bar chart (current month, week by week)
   - Right: Cash Flow Projection (next 30 days, line chart)
3. **VAT Summary Panel** — current quarter VAT liability, EU compliant format per country
4. **Invoice Board** — Kanban layout:
   - Columns: Unpaid → Sent → Paid → Overdue
   - Cards show: client name, amount, due date
   - Drag cards between columns to update status
   - "Create Invoice" button opens form
5. **Expense Tracker** — table of expenses, manual entry or receipt upload (stored in Supabase Storage). Fields: description, amount, category, date, receipt.
6. **Export button** — generates CSV or PDF of invoices/expenses for accounting software

### Invoice Creation Form
Fields: Client name, line items (description + unit price + quantity), due date, VAT rate (auto-set by country), notes. Preview before saving. No PDF generation in v1 — saved to DB only.

---

## 7. Planning Module

### Layout (top to bottom)
1. **Who's In Today** — same component as Overview, full width here
2. **View Toggle** — Weekly / Monthly
3. **Weekly Schedule Grid:**
   - Rows: employees
   - Columns: Mon–Sun
   - Each cell shows shift time or leave badge
   - **Drag to create** a new shift on empty cell
   - **Click existing shift** to edit details (time, notes) via inline popover
   - Conflict detection: overlapping shifts highlighted in red
   - Public holidays auto-populated (greyed cells) based on business country
4. **Monthly Calendar View** — standard calendar, shift blocks shown per day, click day to drill into weekly view
5. **Team Availability Overview** — horizontal bar per employee showing available / busy / off per week
6. **Time-Off Requests Panel:**
   - Employee-submitted requests shown as a list
   - Admin can approve / reject inline
   - Approved requests auto-block the shift grid
7. **Export** — PDF or CSV of current week/month schedule

---

## 8. Team & Roles Module

### Layout
1. **Header** — employee count, "Invite Employee" button
2. **Employee List Table:**
   - Columns: Name + avatar / Role / Access level / Status (Active / On leave / Deactivated) / Actions
   - Actions: View profile, Edit permissions, Deactivate
3. **Employee Profile Page** (drill-in):
   - Contact info (name, email, phone)
   - Current access level
   - Their schedule (pulled from Planning)
   - Activity history (last actions in the system)
4. **Activity Log** — full organisation-wide log. Who did what, when. Filterable by user and action type.
5. **Invite Flow** — enter email → Resend fires invite email with join link → invitee signs up → auto-joined to the business with default Employee role → admin can edit permissions

### Access Levels (per-employee)
- **Admin** — full access to everything
- **Manager** — Communications + Planning + Team (no Finance)
- **Employee** — own schedule only
- **Accountant** — Finance module only
- Custom: admin can toggle individual module access per person

---

## 9. Settings (Tabbed)

### Tab 1 — Business
- Business name (editable)
- Logo upload/replace
- Country/region (editable — updates VAT, locale, holidays)
- VAT number

### Tab 2 — Integrations
- Gmail: connection status, connected account email, Disconnect / Reconnect button
- Instagram: "Coming soon" placeholder
- Facebook: "Coming soon" placeholder
- Google Calendar: connection status, toggle sync on/off

### Tab 3 — Notifications
- Daily AI digest: toggle on/off, set delivery time (default 7am), email vs in-app vs both
- Invoice overdue alerts: toggle, how many days past due to trigger
- New message alerts: toggle, in-app only

### Tab 4 — Account
- Language / locale override (independent of business country)
- Change password
- Billing & subscription (placeholder UI, not functional in v1)
- Download my data (GDPR — exports all business data as JSON/CSV)
- Delete account (confirmation modal, hard delete with 30-day grace period)

---

## 10. Notification Centre

- Bell icon in top nav, shows unread count badge
- Dropdown panel: list of recent notifications with type icon, message, timestamp
- Click notification → navigates to relevant page/item
- Mark all as read
- Delivered via Supabase Realtime websockets

### Notification Triggers
| Event | Channel |
|---|---|
| New message received | In-app |
| Invoice overdue | Email (Resend) + in-app |
| Time-off request submitted | In-app (admin only) |
| Time-off approved/rejected | Email (Resend) to employee |
| Shift conflict detected | In-app warning |
| Team member invited | Email (Resend) with join link |

---

## 11. Locale & i18n

- **Detection:** Browser `navigator.language` pre-selects language on first load
- **Onboarding step 3:** User confirms or overrides country → sets locale
- **Languages at launch:** French (FR), English (EN), German (DE), Spanish (ES), Italian (IT), Dutch (NL)
- **Implementation:** `next-intl` library, all UI strings in locale JSON files
- **User override:** Available in Settings → Account tab anytime
- **VAT formats:** Set per country, validated on invoice creation
- **Date/number formats:** Locale-aware throughout (dd/mm/yyyy, . vs , decimal separator)

---

## 12. Out of Scope — v1

- Instagram DM integration (schema ready, UI placeholder only)
- Facebook Messenger integration (schema ready, UI placeholder only)
- Invoice PDF generation
- Stripe / payment processing
- Mobile app
- Public API
- Monetization / billing logic
- Marketing website
