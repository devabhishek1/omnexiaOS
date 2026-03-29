# Phase 06 — Communications Module (UI Only)
**MILESTONE PHASE** — pause and await CONTINUE after completion.

## Your Job
Build the full Communications module UI with mock data. Real Gmail sync comes in Phase 07.

## Context
Read `_docs/01-product-spec.md` section 5 (Communications) and `_docs/03-design-system.md` before starting.

## Step 1 — Page Layout (`app/(dashboard)/communications/page.tsx`)
Three-panel layout:
- Top filter bar (full width, 56px height, sticky)
- Left panel: conversation list (320px fixed, scrollable)
- Right panel: thread view (flex-1)

## Step 2 — Filter Bar (`components/communications/FilterBar.tsx`)
- Channel tabs: All | Gmail | Instagram (coming soon) | Facebook (coming soon)
  - Coming soon tabs: muted text, no click action, "(soon)" label
- Status filters: Unread | Read | Replied | Pending — pill toggle buttons
- Priority toggle: "⚡ Priority" button, activates priority filter
- Search input (right side): 240px, "Search messages..."
- Compose button: "+ Compose" primary button (right)

## Step 3 — Conversation List (`components/communications/ConversationList.tsx`)
Scrollable list. Each conversation item:
- Avatar (36px initials)
- Channel badge
- Sender name (bold if unread, normal if read)
- Subject line (muted, truncated)
- Timestamp (right-aligned)
- Unread dot (blue 8px) for unread items
- Priority flame icon 🔥 for priority-flagged items
- Label chips (small, below subject)
- Assigned-to mini avatar (bottom right) if assigned
- Selected state: `var(--accent-light)` background
- Hover: `var(--bg-elevated)` background

Mock data: 8 conversations (mix of Gmail, Instagram placeholder, Facebook placeholder).

## Step 4 — Thread View (`components/communications/ThreadView.tsx`)
Shown when a conversation is selected. If none selected: empty state with inbox icon.

### Header:
- Subject line (bold 16px)
- Channel badge
- Assigned-to dropdown (team member selector)
- Label/tag button
- Mark read/unread button
- Three-dot menu (more actions)

### Message thread:
- Scrollable list of messages in conversation
- Each message:
  - Sender avatar + name + email + timestamp
  - Message body (rendered with line breaks)
  - Inbound: left-aligned, white card
  - Outbound: right-aligned, light blue card

### AI Reply Panel (auto-shows for unread conversations):
- Appears below the thread as a card
- "✦ AI" badge + "Suggested reply"
- Text area pre-filled with mock draft reply
- "Regenerate" ghost button
- "Dismiss" ghost button
- "Send Reply" primary button
- Indigo left border on the card

## Step 5 — Compose Modal (`components/communications/ComposeModal.tsx`)
Triggered by "+ Compose" button or `?compose=true` URL param:
- Modal overlay
- Fields: To (email input), Subject, Body (textarea)
- "Send" primary button + "Cancel" ghost button
- Channel selector: Gmail only for now

## Step 6 — Empty States
- No conversation selected: centered inbox icon + "Select a conversation to read"
- No conversations at all: centered icon + "No messages yet" + "Connect Gmail to get started" button
- Priority filter active with no results: "No priority messages right now"

## Step 7 — Verify
1. `npm run dev` → open `/communications`
2. Click conversations — thread view updates
3. AI reply panel appears for unread items
4. Filter tabs work (filter the mock list)
5. Compose modal opens and closes
6. `npm run build` passes

## Completion
1. `git add .`
2. `git commit -m "feat: phase-06 complete — communications module UI with mock data"`

**✅ MILESTONE — output checkpoint message and wait for CONTINUE.**