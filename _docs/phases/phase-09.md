# Phase 09 — Planning Module
**MILESTONE PHASE** — pause and await CONTINUE after completion.

## Your Job
Build the Planning module: weekly schedule grid with drag-and-drop, monthly calendar view, time-off requests, conflict detection.

## Context
Read `_docs/01-product-spec.md` section 7 (Planning) before starting.

## Step 0 — Version Check
```bash
npm info @dnd-kit/core version
npm info date-fns version
```

## Step 1 — Planning Page Layout (`app/(dashboard)/planning/page.tsx`)
Server component. Fetches employees, shifts, time-off requests, public holidays.
Sections (top to bottom):
1. Who's In Today (reuse component from Phase 05)
2. View toggle (Weekly / Monthly)
3. Schedule grid (conditional on view)
4. Team availability overview
5. Time-off requests panel

## Step 2 — Week Navigator (`components/planning/WeekNavigator.tsx`)
- "< Week of March 24 >" with prev/next arrows
- "Today" button to jump to current week
- Export button (PDF/CSV) — right side

## Step 3 — Weekly Schedule Grid (`components/planning/WeeklyGrid.tsx`)
Grid layout:
- Rows: one per employee
- Columns: Mon / Tue / Wed / Thu / Fri / Sat / Sun
- Each cell: shows shift time block if shift exists, or empty
- Shift block: accent background, white text, start–end time
- Public holiday cells: grey tint, holiday name in tiny text
- On-leave cells: amber tint, "On Leave" label
- Conflict cells (overlapping shifts): red border

### Drag to create:
- Dragging on an empty cell opens a popover: "Start time" + "End time" inputs + Save
- Use @dnd-kit for drag interaction

### Click to edit:
- Clicking an existing shift block opens an inline popover:
  - Start time / End time inputs (pre-filled)
  - Notes input
  - Save + Delete buttons

### Conflict detection:
- On save, check if employee already has a shift on that date
- If overlap: highlight in red, show warning toast

## Step 4 — Monthly Calendar View (`components/planning/MonthlyCalendar.tsx`)
Standard calendar grid (7 columns, 4-6 rows).
Each day cell:
- Day number
- Shift count badge if shifts exist
- Public holiday label if applicable
- Click → switches to weekly view for that week

## Step 5 — Team Availability (`components/planning/AvailabilityOverview.tsx`)
Horizontal bar chart per employee showing:
- Green: available days this week
- Amber: partial (shift < 4 hours)
- Grey: off/leave

## Step 6 — Time-Off Requests Panel (`components/planning/TimeOffPanel.tsx`)
Two sections:
**Pending requests (admin view):**
- List of pending requests: employee name + date range + reason + Approve/Reject buttons
- Approve → updates status, blocks shift grid, sends notification

**Request leave (employee view):**
- Date range picker + reason textarea + "Submit Request" button
- Shows employee's own request history

## Step 7 — Public Holidays Seed
Create `supabase/seed.sql` with public holidays for FR, DE, ES, IT, NL, BE for current year.
Format: `INSERT INTO public_holidays (country_code, date, name) VALUES ...`
At minimum 10 holidays per country.

## Step 8 — Export
"Export" button generates CSV of current week/month schedule.
CSV columns: Employee, Date, Start Time, End Time, Notes.

## Step 9 — Verify
1. `npm run dev` → open `/planning`
2. Weekly grid renders with mock employee data
3. Drag to create shift works
4. Click existing shift → edit popover works
5. Monthly view renders and clicking a day switches to weekly
6. Time-off request can be submitted and approved
7. `npm run build` passes

## Completion
1. `git add .`
2. `git commit -m "feat: phase-09 complete — planning module (schedule grid, drag-drop, monthly view, time-off, conflict detection)"`

**✅ MILESTONE — output checkpoint message and wait for CONTINUE.**