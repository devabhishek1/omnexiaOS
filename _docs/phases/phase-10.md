# Phase 10 — Team & Roles Module
**MILESTONE PHASE** — pause and await CONTINUE after completion.

## Your Job
Build the Team & Roles module: employee list, invite flow, permissions editor, employee profile, activity log.

## Context
Read `_docs/01-product-spec.md` section 8 (Team & Roles) before starting.

## Step 1 — Team Page Layout (`app/(dashboard)/team/page.tsx`)
Server component. Fetches employees + activity logs.
Sections:
1. Header (count + invite button)
2. Employee table
3. Activity log

## Step 2 — Employee Table (`components/team/EmployeeTable.tsx`)
Table columns: Name+Avatar / Role title / Access level / Status / Actions

Each row:
- Avatar (36px initials) + full name + email below
- Role title (e.g. "Commercial", "Designer")
- Access level badge (Admin/Manager/Employee/Accountant)
- Status badge (Active/On Leave/Deactivated)
- Actions: "View Profile →" + three-dot menu (Edit permissions, Deactivate)

Status colors:
- Active: green
- On Leave: amber
- Deactivated: muted/strikethrough

## Step 3 — Invite Employee Modal (`components/team/InviteModal.tsx`)
Triggered by "+ Invite Employee":
- Email input
- Role selector (Admin/Manager/Employee/Accountant)
- Custom module access toggles (Communications/Finance/Planning/Team)
- "Send Invite" button → inserts pending user + fires Resend invite email (stubbed until Phase 13)

## Step 4 — Edit Permissions Modal (`components/team/PermissionsModal.tsx`)
- Shows current role + module access
- Toggle switches per module
- Role selector
- "Save changes" → updates `users` table `module_access` + `role` columns

## Step 5 — Deactivate Flow
Three-dot menu → "Deactivate":
- Confirmation modal: "Are you sure? This will remove their access immediately."
- On confirm: updates `status` to 'deactivated' in `users` + `employees` tables

## Step 6 — Employee Profile Page (`app/(dashboard)/team/[employeeId]/page.tsx`)
Full page (not a modal):
Sections:
1. Header: avatar (64px) + name + role + status badge + "Edit" button
2. Contact info card: email, phone (editable inline)
3. Access level card: current role + module toggles
4. Their schedule (this week): mini grid pulled from `shifts` table
5. Activity history: their last 20 actions from `activity_logs`

## Step 7 — Activity Log (`components/team/ActivityLog.tsx`)
Full-width table at bottom of team page:
- Columns: User / Action / Target / Date
- Filterable by user (dropdown) and action type
- Action types rendered as readable strings:
  `invoice.created` → "Created invoice"
  `shift.updated` → "Updated shift"
  `message.replied` → "Replied to message"
  etc.
- Paginated: 20 rows per page

## Step 8 — Activity Log Middleware
Create a utility `lib/utils/activityLog.ts`:
```typescript
export async function logActivity(supabase: any, params: {
  businessId: string
  userId: string
  action: string
  targetType?: string
  targetId?: string
  metadata?: object
}) {
  await supabase.from('activity_logs').insert(params)
}
```
Call this whenever a significant action occurs (invoice created, shift updated, employee invited, etc.).

## Step 9 — Verify
1. `npm run dev` → open `/team`
2. Employee list renders
3. Invite modal opens, validates, closes
4. Clicking "View Profile →" navigates to profile page
5. Activity log renders with mock data
6. `npm run build` passes

## Completion
1. `git add .`
2. `git commit -m "feat: phase-10 complete — team & roles module (employee list, invite, permissions, profiles, activity log)"`

**✅ MILESTONE — output checkpoint message and wait for CONTINUE.**