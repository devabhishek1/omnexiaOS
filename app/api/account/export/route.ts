import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const TABLES = [
  'businesses', 'users', 'employees', 'invoices', 'expenses',
  'conversations', 'messages', 'shifts', 'time_off_requests',
  'activity_logs', 'notifications', 'integrations',
]

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase.from('users').select('business_id').eq('id', user.id).single()
  if (!userRow?.business_id) return NextResponse.json({ error: 'No business found' }, { status: 400 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'all'
  const admin = createAdminClient()

  // CSV single-table exports
  if (type === 'invoices' || type === 'expenses') {
    const { data } = await admin.from(type).select('*').eq('business_id', userRow.business_id)
    const csv = toCSV(data ?? [])
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="omnexia-${type}.csv"`,
      },
    })
  }

  // Full JSON export
  const exportData: Record<string, unknown[]> = {}
  for (const table of TABLES) {
    const { data } = await admin.from(table).select('*').eq('business_id', userRow.business_id)
    exportData[table] = data ?? []
  }

  const json = JSON.stringify({ exported_at: new Date().toISOString(), business_id: userRow.business_id, data: exportData }, null, 2)
  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="omnexia-export.json"',
    },
  })
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map(h => {
      const v = row[h]
      const s = v == null ? '' : String(v)
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
    }).join(','))
  }
  return lines.join('\n')
}
