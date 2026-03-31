import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

type RawRow = Record<string, string>

const COLUMN_MAP: Record<string, string[]> = {
  client_name: ['client', 'client name', 'customer', 'nom client', 'kunde'],
  amount: ['amount', 'total', 'montant', 'betrag', 'importe'],
  status: ['status', 'statut', 'état', 'zustand'],
  due_date: ['due date', 'duedate', 'due_date', 'échéance', 'fälligkeit'],
  description: ['description', 'note', 'notes', 'memo'],
}

function detectColumn(headers: string[], candidates: string[]): string | undefined {
  const lower = headers.map(h => h.toLowerCase().trim())
  for (const c of candidates) {
    const idx = lower.indexOf(c)
    if (idx !== -1) return headers[idx]
  }
  return undefined
}

function parseAmount(v: string): number {
  return parseFloat(v.replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0
}

function parseDate(v: string): string | null {
  if (!v) return null
  // Try DD/MM/YYYY
  const dmY = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmY) return `${dmY[3]}-${dmY[2].padStart(2, '0')}-${dmY[1].padStart(2, '0')}`
  // Try MM/DD/YYYY
  const mdY = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (mdY) return `${mdY[3]}-${mdY[1].padStart(2, '0')}-${mdY[2].padStart(2, '0')}`
  // Try ISO
  const d = new Date(v)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  return null
}

const STATUS_MAP: Record<string, string> = {
  paid: 'paid', payé: 'paid', bezahlt: 'paid',
  draft: 'draft', brouillon: 'draft', entwurf: 'draft',
  sent: 'sent', envoyé: 'sent', gesendet: 'sent',
  overdue: 'overdue', 'en retard': 'overdue', überfällig: 'overdue',
  cancelled: 'cancelled', annulé: 'cancelled', storniert: 'cancelled',
}

function normaliseStatus(v: string): string {
  return STATUS_MAP[v.toLowerCase().trim()] ?? 'draft'
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase.from('users').select('business_id').eq('id', user.id).single()
  if (!userRow?.business_id) return NextResponse.json({ error: 'No business' }, { status: 400 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  let rows: RawRow[] = []

  if (file.name.endsWith('.csv')) {
    const text = buffer.toString('utf-8')
    const result = Papa.parse<RawRow>(text, { header: true, skipEmptyLines: true })
    rows = result.data
  } else {
    const wb = XLSX.read(buffer, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    rows = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: '' })
  }

  if (!rows.length) return NextResponse.json({ imported: 0, errors: ['File is empty'] })

  const headers = Object.keys(rows[0])
  const colClient = detectColumn(headers, COLUMN_MAP.client_name)
  const colAmount = detectColumn(headers, COLUMN_MAP.amount)
  const colStatus = detectColumn(headers, COLUMN_MAP.status)
  const colDueDate = detectColumn(headers, COLUMN_MAP.due_date)
  const colDesc = detectColumn(headers, COLUMN_MAP.description)

  const errors: string[] = []
  const toInsert: Record<string, unknown>[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const clientName = colClient ? String(row[colClient] ?? '').trim() : ''
    const amountRaw = colAmount ? String(row[colAmount] ?? '').trim() : ''

    if (!clientName) { errors.push(`Row ${i + 2}: missing client name`); continue }
    if (!amountRaw) { errors.push(`Row ${i + 2}: missing amount`); continue }

    const amount = parseAmount(amountRaw)
    if (isNaN(amount) || amount <= 0) { errors.push(`Row ${i + 2}: invalid amount "${amountRaw}"`); continue }

    toInsert.push({
      business_id: userRow.business_id,
      client_name: clientName,
      subtotal: amount,
      total: amount,
      vat_rate: 0,
      vat_amount: 0,
      status: colStatus ? normaliseStatus(String(row[colStatus] ?? '')) : 'draft',
      due_date: colDueDate ? parseDate(String(row[colDueDate] ?? '')) : null,
      notes: colDesc ? String(row[colDesc] ?? '').trim() || null : null,
      source: 'csv_import',
      created_at: new Date().toISOString(),
    })
  }

  if (!toInsert.length) return NextResponse.json({ imported: 0, errors })

  const admin = createAdminClient()
  const { error } = await admin.from('invoices').insert(toInsert)
  if (error) {
    console.error('[finance/import]', error)
    return NextResponse.json({ imported: 0, errors: [error.message] })
  }

  return NextResponse.json({ imported: toInsert.length, errors })
}
