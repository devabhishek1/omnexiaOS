import { createClient } from '@/lib/supabase/server'
import { syncPennylaneInvoices } from '@/lib/pennylane/sync'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { businessId } = await request.json()
  if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 })

  try {
    const result = await syncPennylaneInvoices(businessId)
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'sync failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
