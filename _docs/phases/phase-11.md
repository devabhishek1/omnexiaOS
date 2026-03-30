# Phase 11 — Settings Module
**MILESTONE PHASE** — pause and await CONTINUE after completion.

## Your Job
Build the Settings page with all 4 tabs including Pennylane integration,
CSV import/export, and placeholders for Axonaut and Henrri.

## Context
Read `_docs/01-product-spec.md` section 9 (Settings) before starting.

## Step 1 — Settings Layout (`app/(dashboard)/settings/page.tsx`)
Client component. 4 tabs using shadcn Tabs: Business | Integrations | Notifications | Account

## Step 2 — Business Tab
Editable form:
- Business name input
- Logo: current preview + "Change logo" upload button → Supabase Storage business-logos bucket
- Country/region selector (same as onboarding Step 3)
- VAT number input with format validation (VAT_NUMBER_PATTERNS from lib/utils/vat.ts)
- VAT rate: editable number input (pre-filled from country, manually overridable)
- Currency: dropdown (EUR default for all EU)
- Date format: DD/MM/YYYY or MM/DD/YYYY toggle
- "Save changes" → updates businesses table
- Success toast on save

## Step 3 — Integrations Tab
Organised in sections:

### Communications Integrations
**Gmail card:**
- Status indicator: Connected (green dot + email address) or Disconnected (red dot)
- Connected state: "Connected as [email]" + "Disconnect" button + "Last synced: [timestamp]"
- Disconnected state: "Connect Gmail" button → triggers OAuth
- Webhook status: "Real-time sync active" or "Webhook inactive — reconnect"

**Instagram card:**
- "Coming soon" amber badge
- Muted description + greyed UI
- "Notify me when available" toggle (stores in user preferences)

**Facebook card:**
- Same as Instagram

### Finance Integrations
**Pennylane card:**
- Status: Connected (green) or Disconnected
- Connected: account name + "Last synced: [timestamp]" + "Sync now" button + "Disconnect"
- Disconnected: "Connect Pennylane" primary button
- Below: "Pennylane is the most popular invoicing tool for French SMBs"
- OAuth flow: redirect to Pennylane → callback → store tokens

**Axonaut card:**
- "Coming soon" badge
- Muted description: "Connect Axonaut to sync your invoices and quotes"

**Henrri (by Rivalis) card:**
- "Coming soon" badge
- Muted description: "Connect Henrri to sync your invoices"

**QuickBooks / Sage card:**
- "Coming soon" badge

**CSV Import card (always available, no "coming soon"):**
- Title: "Import invoices from CSV / Excel"
- Description: "Upload a spreadsheet with your existing invoices"
- "Upload file" button → opens file picker (accepts .csv, .xlsx)
- Expected columns shown: Client, Amount, Status, Due Date
- On upload: parse file, preview first 5 rows in a table, confirm import
- Maps columns automatically, manual mapping fallback
- Imports to invoices table with source: 'csv_import'

**CSV Export card:**
- "Export all data" button → downloads full invoices + expenses CSV
- "Export invoices only" + "Export expenses only" options

### Calendar Integration
**Google Calendar card:**
- Status: Connected / Disconnected
- Toggle to enable/disable calendar sync for Planning module
- Connected: shows which calendar is synced

## Step 4 — Notifications Tab
Toggle switches:

**Daily AI Digest:**
- Toggle on/off
- Time picker (default 07:00)
- Delivery: "Email" toggle + "In-app" toggle

**Invoice Overdue Alerts:**
- Toggle on/off
- "Trigger after [3] days overdue" — number input

**New Message Alerts:**
- Toggle on/off
- In-app only

**Pennylane Sync Alerts:**
- Toggle on/off
- "Notify when sync fails or finds new overdue invoices"

"Save preferences" → updates user preferences in Supabase

## Step 5 — Account Tab
**Language:**
- Language selector (6 options with flags, names in own language)
- "Save" → updates users.locale + businesses.locale, reloads with new locale

**Password:**
- Current + New + Confirm password
- "Update password" → supabase.auth.updateUser({ password })

**Billing (placeholder):**
- "Plan: Pro" badge
- "Manage subscription" button (disabled, tooltip "Coming soon")

**Data & Privacy:**
- "Download my data" → GDPR export (JSON) via /api/account/export
- "Delete account" → confirmation modal, 30-day grace period

## Step 6 — GDPR Export Route (`app/api/account/export/route.ts`)
Fetches all data for business_id across all tables.
Returns JSON with Content-Disposition: attachment; filename="omnexia-export.json"

## Step 7 — CSV Import Logic (`app/api/finance/import/route.ts`)
POST endpoint accepting multipart/form-data with CSV or XLSX file.
- Parse file (use papaparse for CSV, xlsx library for Excel)
- Auto-detect columns by header name matching
- Validate required fields (client name, amount, status)
- Insert to invoices table with source: 'csv_import'
- Return { imported: N, errors: [] }

## Step 8 — Verify
1. `npm run dev` → `/settings`
2. All 4 tabs render
3. Business form saves correctly
4. Pennylane card shows connect button
5. CSV import card visible and working
6. Instagram/Facebook/Axonaut/Henrri show "coming soon"
7. Notifications toggles save
8. Language change updates UI
9. `npm run build` + `npx tsc --noEmit` pass

## Completion
1. `git add .`
2. `git commit -m "feat: phase-11 complete — settings (business, Pennylane+CSV integrations, notifications, account, GDPR)"`

**✅ MILESTONE — output checkpoint message and wait for CONTINUE.**
