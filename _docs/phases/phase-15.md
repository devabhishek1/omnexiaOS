# Phase 15 — Polish Pass (Empty States, Errors, Loading, Final QA)
**MILESTONE PHASE** — This is the final phase. Full review before sign-off.

## Your Job
Make the app production-ready. Add empty states everywhere, error boundaries, loading skeletons, mobile warning, and fix anything broken.

## Step 1 — Empty States
Every page and list needs an empty state. Go through each:

- Communications: no conversations → inbox icon + "No messages yet" + "Connect Gmail" CTA
- Finance invoices: no invoices → receipt icon + "No invoices yet" + "Create Invoice" CTA
- Finance expenses: no expenses → "No expenses recorded" + "Add Expense" CTA
- Planning: no shifts → calendar icon + "No shifts scheduled" + "Add Shift" CTA
- Team: no employees → people icon + "No team members yet" + "Invite Employee" CTA
- Notifications: empty → bell icon + "You're all caught up"
- Activity log: empty → "No activity yet"

Style: centered in content area, muted icon (48px), primary text 15px, secondary muted 13px, optional CTA button.

## Step 2 — Loading Skeletons
Add skeleton loading states for:
- Conversation list (while fetching)
- AI Digest card (while generating or loading)
- Invoice Kanban board (while fetching)
- Employee table (while fetching)
- Finance charts (while fetching)

Use shadcn `Skeleton` component. Match the shape of the content being loaded.

## Step 3 — Error Boundaries
Add `error.tsx` files in:
- `app/(dashboard)/error.tsx` — catches all dashboard errors
- `app/(dashboard)/communications/error.tsx`
- `app/(dashboard)/finance/error.tsx`

Each error page: "Something went wrong" + retry button + back to overview link.

Add `not-found.tsx` in `app/` — clean 404 page.

## Step 4 — Mobile Warning
Below 768px viewport: show a full-screen overlay:
"Omnexia is optimised for desktop. Please open on a computer for the best experience."
Omnexia logo + message + optionally a "Continue anyway" link that dismisses.

Implement as a client component in the dashboard layout that checks viewport width.

## Step 5 — Final TypeScript Pass
```bash
npx tsc --noEmit
```
Fix ALL TypeScript errors. Zero tolerance.

## Step 6 — Final Lint Pass
```bash
npm run lint
```
Fix ALL lint warnings and errors.

## Step 7 — Final Build
```bash
npm run build
```
Must produce zero errors and zero warnings.

## Step 8 — Manual QA Checklist
Walk through every screen and verify:

**Auth:**
- [ ] Login renders correctly
- [ ] Signup renders correctly
- [ ] Password reset renders correctly

**Onboarding:**
- [ ] All 9 steps render and navigate correctly
- [ ] Required steps block progression
- [ ] Skip buttons work on optional steps

**Overview:**
- [ ] All widgets render
- [ ] AI digest card visible
- [ ] Stat cards render
- [ ] Messages panel clickable

**Communications:**
- [ ] Conversation list renders
- [ ] Thread view updates on selection
- [ ] Filter tabs work
- [ ] AI reply panel shows
- [ ] Compose modal opens/closes

**Finance:**
- [ ] KPI bar renders
- [ ] Charts render
- [ ] Invoice Kanban renders
- [ ] Drag between columns works
- [ ] Invoice creation saves
- [ ] Expense table adds/deletes

**Planning:**
- [ ] Weekly grid renders
- [ ] Monthly calendar renders
- [ ] Time-off panel shows

**Team:**
- [ ] Employee list renders
- [ ] Profile page navigates
- [ ] Activity log renders

**Settings:**
- [ ] All 4 tabs render
- [ ] Business form saves
- [ ] Language switcher works

**General:**
- [ ] Sidebar navigation works on all routes
- [ ] Notification bell renders
- [ ] No console errors
- [ ] Mobile warning shows below 768px

## Step 9 — Final Commit
1. `git add .`
2. `git commit -m "feat: phase-15 complete — polish pass, empty states, skeletons, error boundaries, mobile warning, QA"`
3. `git push origin main`

**✅ FINAL MILESTONE — Output: "🚀 NEXUS BUILD COMPLETE. All 15 phases done. Ready for Supabase setup and deployment."**