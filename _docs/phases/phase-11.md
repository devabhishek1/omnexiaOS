# Phase 11 — Settings Module
**MILESTONE PHASE** — pause and await CONTINUE after completion.

## Your Job
Build the Settings page with all 4 tabs: Business, Integrations, Notifications, Account.

## Context
Read `_docs/01-product-spec.md` section 9 (Settings) before starting.

## Step 1 — Settings Layout (`app/(dashboard)/settings/page.tsx`)
Client component (needs interactivity for tabs).
4 tabs using shadcn `Tabs` component: Business | Integrations | Notifications | Account

## Step 2 — Business Tab
Editable form:
- Business name input
- Logo: current logo preview + "Change logo" upload button
- Country/region selector (same dropdown as onboarding)
- VAT number input with format validation (use `VAT_NUMBER_PATTERNS` from `lib/utils/vat.ts`)
- "Save changes" button → updates `businesses` table
- Show success toast on save

## Step 3 — Integrations Tab
Cards for each integration:

**Gmail card:**
- Status: Connected (green dot) or Disconnected (red dot)
- Connected: shows email address, "Disconnect" button
- Disconnected: "Connect Gmail" button → triggers OAuth
- Last synced: timestamp

**Instagram card:**
- "Coming soon" badge
- Muted description: "Instagram DMs integration — available in a future update"
- Greyed out

**Facebook card:**
- Same as Instagram

**Google Calendar card:**
- Status: Connected / Disconnected
- Toggle to enable/disable calendar sync for Planning module

## Step 4 — Notifications Tab
Toggle switches with labels:

**Daily AI Digest:**
- Toggle on/off
- Time picker: "Deliver at [07:00] [timezone]"
- Delivery method: "Email" toggle + "In-app" toggle (both can be on)

**Invoice Overdue Alerts:**
- Toggle on/off
- "Trigger after [3] days overdue" — number input

**New Message Alerts:**
- Toggle on/off
- In-app only label

"Save preferences" button → updates user preferences in Supabase.

## Step 5 — Account Tab
Sections:

**Language:**
- Language selector (6 options with flags)
- "Save" → updates `users.locale`, reloads with new locale

**Password:**
- Current password + New password + Confirm password
- "Update password" → `supabase.auth.updateUser({ password })`

**Billing (placeholder):**
- "Plan: Pro" badge
- "Manage subscription" button (disabled, shows tooltip "Coming soon")

**Data & Privacy:**
- "Download my data" button → triggers GDPR export API route
- Returns JSON/CSV zip of all business data

**Danger Zone:**
- "Delete account" button (red, outlined)
- Confirmation modal: type business name to confirm
- On confirm: soft delete (sets status to 'deactivated'), 30-day grace period notice

## Step 6 — GDPR Export API Route (`app/api/account/export/route.ts`)
GET endpoint:
- Fetches all data for `business_id` from all tables
- Returns JSON with all data
- Sets `Content-Disposition: attachment; filename="omnexia-export.json"`

## Step 7 — Verify
1. `npm run dev` → open `/settings`
2. All 4 tabs render
3. Business form saves correctly
4. Notifications toggles save
5. Language change updates UI
6. `npm run build` passes

## Completion
1. `git add .`
2. `git commit -m "feat: phase-11 complete — settings (business, integrations, notifications, account, GDPR export)"`

**✅ MILESTONE — output checkpoint message and wait for CONTINUE.**