# Phase 04 — Dashboard Layout Shell (Sidebar + Topbar + Routing)
**MILESTONE PHASE** — pause and await CONTINUE after completion.

## Your Job
Build the persistent dashboard shell: sidebar, topbar, notification bell, and routing between all modules. No module content yet — just placeholder pages with the correct layout.

## Context
Read `_docs/03-design-system.md` sections 5 (components) and 6 (layout grid) carefully before starting.

## Step 1 — Dashboard Layout (`app/(dashboard)/layout.tsx`)
This wraps ALL dashboard pages. It renders:
- Fixed sidebar (220px, left)
- Main content area (flex-1, margin-left 220px)
  - Sticky topbar (56px)
  - Page content (padding 28px)

The layout must be a server component that fetches the current user + business from Supabase and passes them down via context.

## Step 2 — Sidebar (`components/layout/Sidebar.tsx`)

### Structure (top to bottom):
1. **Logo section** (padding 24px 20px, bottom border):
   - Black 32px square, border-radius 8px, white "N" inside
   - "Omnexia" bold 15px + "Business OS" muted 10px

2. **Business selector** (padding 16px 20px, bottom border):
   - Cream background pill showing business avatar + name + plan
   - "Plan Pro" badge (placeholder)
   - Dropdown chevron

3. **Navigation** (flex-1, padding 12px):
   Nav items with icons (lucide-react):
   - LayoutDashboard → Overview (`/overview`)
   - Inbox → Communications (`/communications`) + unread badge
   - Receipt → Finance (`/finance`)
   - Calendar → Planning (`/planning`)
   - Users → Team & Roles (`/team`)
   - Settings → Settings (`/settings`)

   Active state: `var(--accent-light)` bg, `var(--accent)` color, semibold
   Hover state: `var(--bg-elevated)` bg
   Transition: 0.1s

4. **User section** (bottom, top border):
   - Avatar (initials) + name + role label

### Behaviour:
- At 1024px width: sidebar collapses to icon-only (64px wide, no labels)
- Active route highlighted based on `usePathname()`

## Step 3 — Topbar (`components/layout/Topbar.tsx`)
- Height 56px, white, bottom border
- Left: Current page title (bold 16px) — derived from route
- Right:
  - Search bar: cream bg, border, "🔍 Search..." placeholder, 200px wide
  - Notification bell button (36px square, cream bg, border)
    - Red badge with unread count if notifications exist
  - (Future: user avatar dropdown)

## Step 4 — Notification Panel (`components/layout/NotificationPanel.tsx`)
Dropdown panel triggered by bell icon:
- Width 360px, white, border, border-radius 12px, shadow
- Header: "Notifications" + "Mark all read" button
- List of notification items:
  - Icon (type-based) + title + body + timestamp
  - Unread items: slightly blue-tinted background
  - Click → navigate to `notification.link`
- Empty state: "No notifications yet"
- Supabase Realtime subscription: listen for INSERT on `notifications` table filtered by `user_id`

## Step 5 — Placeholder Pages
Create minimal placeholder for each route that renders inside the layout:

`app/(dashboard)/overview/page.tsx` → `<div>Overview — coming in Phase 05</div>`
`app/(dashboard)/communications/page.tsx` → `<div>Communications — coming in Phase 06</div>`
`app/(dashboard)/finance/page.tsx` → `<div>Finance — coming in Phase 08</div>`
`app/(dashboard)/planning/page.tsx` → `<div>Planning — coming in Phase 09</div>`
`app/(dashboard)/team/page.tsx` → `<div>Team — coming in Phase 10</div>`
`app/(dashboard)/settings/page.tsx` → `<div>Settings — coming in Phase 11</div>`

## Step 6 — Shared Layout Components
Create these reusable components (used across all modules):

`components/layout/Card.tsx` — white card with border, border-radius 12px, padding 24px, accepts `className` prop
`components/layout/SectionTitle.tsx` — uppercase muted label (13px, 0.08em tracking)
`components/layout/Badge.tsx` — colored pill badge, accepts `label` + `variant` (success/warning/error/default)
`components/layout/ChannelBadge.tsx` — Gmail/Instagram/Facebook colored badge
`components/layout/Avatar.tsx` — initials avatar, accepts `initials`, `size`, optional `imageUrl`
`components/layout/AIBadge.tsx` — "✦ AI" indigo badge

## Step 7 — Verify
1. `npm run dev`
2. Navigate to `/overview` — sidebar and topbar should render
3. Click each nav item — routes correctly
4. Sidebar highlights active route
5. Notification bell renders (empty state panel)
6. At 1024px viewport — sidebar collapses to icons
7. `npm run build` passes

## Completion
1. `git add .`
2. `git commit -m "feat: phase-04 complete — dashboard layout shell, sidebar, topbar, notification panel, routing"`

**✅ MILESTONE — output checkpoint message and wait for CONTINUE.**
