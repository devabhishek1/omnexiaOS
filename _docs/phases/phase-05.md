# Phase 05 — Overview Page (Dashboard Home)
**MILESTONE PHASE** — pause and await CONTINUE after completion.

## Your Job
Build the full Overview page with all widgets. Use mock/placeholder data for now — real data comes when APIs are wired in later phases.

## Context
Read `_docs/01-product-spec.md` section 4 (Overview Page) and `_docs/03-design-system.md` section 6 (layout grid) before starting.

## Layout (top to bottom)
1. Alert strip
2. AI Digest card
3. 4 stat cards
4. Quick actions row
5. Two-column: Messages panel (60%) | Finance snapshot (40%)
6. Who's In Today

## Step 1 — Alert Strip (`components/overview/AlertStrip.tsx`)
- Full width, amber background (`var(--amber-light)`), amber border bottom
- Shows urgent items: overdue invoices, urgent messages, shift conflicts
- Each alert: icon + message + "View" link + × dismiss button
- If no alerts: don't render the strip at all
- Mock data for now: 1 overdue invoice alert

## Step 2 — AI Digest Card (`components/overview/DigestCard.tsx`)
Exact spec from the prototype:
- Dark card (`var(--dark-card)` background, no border)
- Top row: "✦ AI DIGEST — [today's date]" in muted uppercase + "Regenerate →" button (dark surface)
- Body: white text, 15px, line-height 1.6, max-width 580px
  Mock text: "You have **24 unread messages**, 3 urgent. The TechParis invoice is 9 days overdue. Marc Petit is on leave until April 2 — consider reassigning their support tickets."
  (Bold spans in accent blue `#93C5FD`)
- Bottom row (border-top dark): Gmail X msgs / Instagram X msgs / Facebook X msgs in muted text
- "✦ AI" indigo badge next to the title

## Step 3 — Stat Cards (`components/overview/StatCards.tsx`)
4-column grid, gap 16px. Each card:
- Label (muted, uppercase, 12px)
- Large value (bold, 28px)
- Delta text below (colored based on sentiment)
- Subtle colored left border matching the metric color

Cards:
1. **Unread Messages** — value: 24, delta: "+3 today" (blue)
2. **Pending Invoices** — value: €8,420, delta: "3 invoices" (amber)
3. **Active Employees** — value: 12, delta: "2 on leave" (green)
4. **Today's Tasks** — value: 7, delta: "3 urgent" (red)

## Step 4 — Quick Actions (`components/overview/QuickActions.tsx`)
Row of 2 buttons:
- "✏️ Compose Message" → navigates to `/communications?compose=true`
- "📄 Create Invoice" → navigates to `/finance?create=true`

Style: secondary buttons, side by side, left-aligned.

## Step 5 — Messages Panel (`components/overview/LatestMessages.tsx`)
Left column (60% width). Card component.
- Section title: "LATEST MESSAGES"
- List of 5 message rows. Each row:
  - Avatar (initials, 36px)
  - Channel badge (Gmail/Instagram/Facebook)
  - Sender name (bold 14px) + subject (muted 13px)
  - Timestamp (right-aligned, muted 12px)
  - Unread dot (blue, 8px) if unread
  - Hover: slight bg tint, cursor pointer
  - Click → navigates to `/communications/[id]`

Mock data (5 items matching the prototype):
1. Marie Dupont — Gmail — "Devis projet Q2" — 09:14 — unread
2. @boutique_leon — Instagram — "Question sur vos délais" — 08:52 — unread
3. Paul Renard — Facebook — "Retour commande #4821" — 08:30
4. Comptabilité KPMG — Gmail — "Rapport mensuel mars" — Yesterday
5. @creativestudio — Instagram — "Collaboration possible?" — Yesterday

## Step 6 — Finance Snapshot (`components/overview/FinanceSnapshot.tsx`)
Right column (40% width). Card component.
- Section title: "FINANCE — [current month + year]"
- 3 metric columns: Revenue (green) / Expenses (red) / Net (primary)
  Mock: €12,480 / €4,210 / €8,270
- Divider
- Section title: "LATEST INVOICES"
- List of 3 invoice rows:
  - Client name + date
  - Amount + status badge (Paid/Pending/Overdue)
  Mock:
  - Acme SAS — 28 mars — €2,400 — Paid
  - Studio Blanc — 31 mars — €1,800 — Pending
  - TechParis — 20 mars — €4,220 — Overdue

## Step 7 — Who's In Today (`components/overview/WhoIsIn.tsx`)
Full width. Card component.
- Section title: "WHO'S IN TODAY"
- Row of employee avatar chips:
  - Avatar (initials, 32px) + name + status dot
  - Green dot = in / Amber dot = partial / Grey = off/leave
  Mock: Sophie (in), Thomas (in), Marc (leave), Léa (in), Julie (in)

## Step 8 — Assemble the Overview Page
`app/(dashboard)/overview/page.tsx`:
- Server component, fetches user + business
- Renders all components in correct order with correct spacing (gap: 24px between sections)
- Passes mock data as props (we'll replace with real Supabase queries in later phases)

## Step 9 — Verify
1. `npm run dev` → open `/overview`
2. All sections render correctly
3. Matches the prototype screenshot visually
4. No layout overflow
5. Responsive at 1024px (sidebar icon-only mode)
6. `npm run build` passes

## Completion
1. `git add .`
2. `git commit -m "feat: phase-05 complete — overview page with all widgets (mock data)"`

**✅ MILESTONE — output checkpoint message and wait for CONTINUE.**
