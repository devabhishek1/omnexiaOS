# Phase 08 — Finance Module
**MILESTONE PHASE** — pause and await CONTINUE after completion.

## Your Job
Build the complete Finance module: KPI bar, charts, invoice Kanban board, expense tracker, VAT panel, export.

## Context
Read `_docs/01-product-spec.md` section 6 (Finance) and `_docs/02-tech-stack.md` (invoices + expenses tables) before starting.

## Step 0 — Version Check
```bash
npm info recharts version
npm info @dnd-kit/core version
npm info @dnd-kit/sortable version
```

## Step 1 — Finance Page Layout (`app/(dashboard)/finance/page.tsx`)
Server component. Fetches invoices + expenses + aggregates from Supabase.
Sections (top to bottom, gap 24px):
1. KPI bar
2. Two-column charts row
3. VAT panel
4. Invoice Kanban board
5. Expense tracker
6. Export button

## Step 2 — KPI Bar (`components/finance/KPIBar.tsx`)
3 metric tiles in a row (full width card):
- Revenue: sum of paid invoices current month (green)
- Expenses: sum of expenses current month (red)
- Net: revenue minus expenses (primary blue if positive, red if negative)
- Month toggle: "< March 2026 >" to navigate months

## Step 3 — Charts (`components/finance/RevenueChart.tsx` + `components/finance/CashFlowChart.tsx`)
Use `recharts`. Read latest recharts docs pattern before implementing.

**RevenueChart:** Bar chart. X-axis: weeks of current month. Two bars per week: Revenue (green) vs Expenses (red). Responsive container.

**CashFlowChart:** Line chart. X-axis: next 30 days. Single line showing projected cash position. Mock projection: current balance ± scheduled invoices due.

## Step 4 — VAT Panel (`components/finance/VATPanel.tsx`)
Card showing:
- Current quarter VAT liability
- VAT rate for business country (from `lib/utils/vat.ts`)
- "Total invoiced excl. VAT" + "VAT amount" + "Total incl. VAT"
- Small: "Based on [country] standard VAT rate of [X]%"

Create `lib/utils/vat.ts` with `VAT_RATES` and `VAT_NUMBER_PATTERNS` from `_docs/04-api-backend.md` section 9.

## Step 5 — Invoice Kanban Board (`components/finance/InvoiceBoard.tsx`)
Use `@dnd-kit/core` and `@dnd-kit/sortable`.
4 columns: Unpaid | Sent | Paid | Overdue
Each card shows: client name, amount (bold), due date, days overdue (if applicable).
Drag card between columns → updates `status` in Supabase.
Overdue column: red header tint.
"+ Create Invoice" button above the board (right-aligned).

## Step 6 — Invoice Creation Modal (`components/finance/InvoiceModal.tsx`)
Triggered by "+ Create Invoice" or `?create=true` URL param.
Fields:
- Client name (text input)
- Line items: table with rows (description, quantity, unit price) + "Add line" button
- Auto-calculated: subtotal, VAT (rate from business country), total
- Due date (date picker)
- Notes (textarea, optional)
- "Save Invoice" primary button → inserts to Supabase with status 'unpaid'

## Step 7 — Expense Tracker (`components/finance/ExpenseTable.tsx`)
Table with columns: Date / Description / Category / Amount / Receipt / Actions
- "Add Expense" button opens inline form row at top of table
- Fields: description, amount, category (dropdown: Office/Travel/Marketing/Software/Other), date, receipt upload
- Receipt upload → stores in Supabase Storage `receipts` bucket
- Delete button per row

## Step 8 — Export Button
"Export" dropdown button: CSV or PDF (PDF just shows a toast "PDF export coming soon" for v1).
CSV export: generates and downloads invoices + expenses as CSV using browser Blob API.

## Step 9 — Check Overdue Edge Function (`supabase/functions/check-overdue/index.ts`)
Daily cron at 9am UTC:
- Query invoices where `due_date < NOW()` and `status != 'paid'`
- Update status to `overdue`
- Insert notification row for admin
- (Resend email wired in Phase 13)

## Step 10 — Verify
1. `npm run dev` → open `/finance`
2. KPI bar renders with data
3. Charts render (may use mock data)
4. Kanban board renders, drag works between columns
5. Invoice creation modal saves to Supabase
6. Expense table adds/deletes rows
7. `npm run build` passes

## Completion
1. `git add .`
2. `git commit -m "feat: phase-08 complete — finance module (KPI, charts, Kanban invoices, expenses, VAT, export)"`

**✅ MILESTONE — output checkpoint message and wait for CONTINUE.**