# Phase 06 — Communications Module (UI Only)
**MILESTONE PHASE** — pause and await CONTINUE after completion.

## Your Job
Build the full Communications module UI with mock data. Real Gmail sync comes in Phase 07.

## Context
Read `_docs/01-product-spec.md` section 5 (Communications) and `_docs/03-design-system.md` before starting.

## Key Design Principle — Assistant Workflow
Omnexia is designed for a business owner who has an assistant managing their inbox.
The UI must make this crystal clear:
- Every conversation shows WHO it is assigned to
- The "Assign to" dropdown must be front and centre in the thread view header
- Replies are sent "as" the business — show "Replying as [Business Name]" above the reply box
- The composer shows the business name/email as sender, not the individual user's name

## Step 1 — Page Layout (`app/(dashboard)/communications/page.tsx`)
Three-panel layout:
- Top filter bar (full width, 56px, sticky)
- Left panel: conversation list (320px fixed, scrollable)
- Right panel: thread view (flex-1)

## Step 2 — Filter Bar (`components/communications/FilterBar.tsx`)
- Channel tabs: All | Gmail | Instagram (coming soon) | Facebook (coming soon)
- Status filters: Unread | Read | Replied | Pending — pill toggles
- Priority toggle: "⚡ Priority" button
- "👤 Mine" toggle — filters to conversations assigned to current user
- Search input: 240px
- "+ Compose" primary button (far right)

## Step 3 — Conversation List (`components/communications/ConversationList.tsx`)
Each item:
- Avatar (36px initials) + channel badge + sender name (bold if unread)
- Subject preview (truncated, muted)
- Timestamp (right-aligned)
- Unread dot (blue 8px) + priority flame 🔥 if urgent
- Label chips
- Assigned-to mini avatar (20px, bottom right) — always visible
- Selected: accent-light bg. Hover: bg-elevated

Mock data: 8 conversations (5 Gmail, 2 Instagram placeholder, 1 Facebook placeholder)

## Step 4 — Thread View (`components/communications/ThreadView.tsx`)
Empty state: inbox icon + "Select a conversation to start reading"

### Thread header:
- Subject (bold 16px) + channel badge
- **Assign to dropdown** — top right, prominent, shows current assignee avatar + name
- Label button + Mark read/unread + three-dot menu

### Sender info bar:
- Sender name + email + timestamp + "via Gmail" indicator

### Message thread (scrollable):
- Inbound: left-aligned, white card
- Outbound: right-aligned, accent-light card
- Full thread chronological order

### Reply composer (always visible at bottom):
- **"Replying as [Business Name]"** in muted text above textarea — non-negotiable
- Textarea (min 3 rows, auto-expands)
- Send button (primary, shows "Send via Gmail") + Discard (ghost)

### AI Reply Panel (above composer, auto-appears for unread):
- Indigo left border card
- "✦ AI Draft" badge + "Regenerate" ghost button + "✕ Dismiss"
- Mock draft pre-filled in textarea
- "Use this draft" button → copies into composer
- Dismissed state remembered per conversation in localStorage

## Step 5 — Compose Modal (`components/communications/ComposeModal.tsx`)
- To (email chips) + Subject + Body (8 rows textarea)
- "Sending as [Business Name]" muted text above footer
- "Send via Gmail" primary + Cancel ghost

## Step 6 — Empty + Coming Soon States
- No conversations: "No messages yet — Gmail will sync shortly"
- Instagram tab: "Instagram DMs coming soon"
- Facebook tab: "Facebook Messenger coming soon"
- Priority empty: "No priority messages — you're all caught up 🎉"

## Step 7 — Verify
1. `npm run dev` → `/communications` renders
2. Conversation list shows mock data
3. Clicking conversation updates thread view
4. Assign-to dropdown prominent in thread header
5. "Replying as [Business Name]" visible above reply textarea
6. AI draft panel auto-appears for unread items
7. Compose modal opens/closes
8. `npm run build` + `npx tsc --noEmit` pass

## Completion
1. `git add .`
2. `git commit -m "feat: phase-06 complete — communications UI with assistant workflow"`

**✅ MILESTONE — output checkpoint message and wait for CONTINUE.**
