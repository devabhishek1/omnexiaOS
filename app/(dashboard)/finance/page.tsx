'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import DataSourceBar from '@/components/finance/DataSourceBar'
import KPIBar from '@/components/finance/KPIBar'
import RevenueChart from '@/components/finance/RevenueChart'
import CashFlowChart from '@/components/finance/CashFlowChart'
import VATPanel from '@/components/finance/VATPanel'
import InvoiceBoard from '@/components/finance/InvoiceBoard'
import ExpenseTable from '@/components/finance/ExpenseTable'
import type { InvoicePayload } from '@/components/finance/InvoiceModal'
import { Download } from 'lucide-react'

interface Invoice {
  id: string
  client_name: string
  client_email: string | null
  total: number
  subtotal: number | null
  vat_rate: number | null
  vat_amount: number | null
  currency: string
  status: string
  source: string
  due_date: string | null
  issued_date: string | null
}

interface Expense {
  id: string
  description: string
  amount: number
  currency: string
  category: string
  receipt_url: string | null
  date: string
}

interface Integration {
  last_synced_at: string | null
  status: string
}

interface Business {
  id: string
  country_code: string
  vat_number: string | null
}

export default function FinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [integration, setIntegration] = useState<Integration | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [sourceFilter, setSourceFilter] = useState<'all' | 'native' | 'pennylane'>('all')
  const [month, setMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userRow } = await supabase.from('users').select('business_id').eq('id', user.id).single()
    if (!userRow?.business_id) return

    const [bizRes, invRes, expRes, intRes] = await Promise.all([
      supabase.from('businesses').select('id, country_code, vat_number').eq('id', userRow.business_id).single(),
      supabase.from('invoices').select('*').eq('business_id', userRow.business_id).order('issued_date', { ascending: false }),
      supabase.from('expenses').select('*').eq('business_id', userRow.business_id).order('date', { ascending: false }),
      supabase.from('integrations').select('last_synced_at, status').eq('business_id', userRow.business_id).eq('provider', 'pennylane').maybeSingle(),
    ])

    if (bizRes.data) setBusiness(bizRes.data)
    if (invRes.data) setInvoices(invRes.data)
    if (expRes.data) setExpenses(expRes.data)
    if (intRes.data) setIntegration(intRes.data)
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  // Realtime subscriptions — keep invoices + expenses in sync across tabs/devices
  useEffect(() => {
    if (!business?.id) return
    const channel = supabase
      .channel(`finance:${business.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices', filter: `business_id=eq.${business.id}` }, payload => {
        if (payload.eventType === 'INSERT') setInvoices(prev => [payload.new as Invoice, ...prev])
        if (payload.eventType === 'UPDATE') setInvoices(prev => prev.map(i => i.id === payload.new.id ? payload.new as Invoice : i))
        if (payload.eventType === 'DELETE') setInvoices(prev => prev.filter(i => i.id !== payload.old.id))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `business_id=eq.${business.id}` }, payload => {
        if (payload.eventType === 'INSERT') setExpenses(prev => [payload.new as Expense, ...prev])
        if (payload.eventType === 'UPDATE') setExpenses(prev => prev.map(e => e.id === payload.new.id ? payload.new as Expense : e))
        if (payload.eventType === 'DELETE') setExpenses(prev => prev.filter(e => e.id !== payload.old.id))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [business?.id, supabase])

  async function handleStatusChange(id: string, newStatus: string) {
    await supabase.from('invoices').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id)
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv))
  }

  async function handleCreateInvoice(payload: InvoicePayload) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !business) return
    const { data, error } = await supabase.from('invoices').insert({
      ...payload,
      business_id: business.id,
      created_by: user.id,
    }).select().single()
    if (error) throw error
    if (data) setInvoices(prev => [data as Invoice, ...prev])
  }

  async function handleSyncNow() {
    if (!business) return
    await fetch('/api/integrations/pennylane/sync', { method: 'POST', body: JSON.stringify({ businessId: business.id }), headers: { 'Content-Type': 'application/json' } })
    await load()
  }

  function exportInvoicesCSV() {
    const headers = ['Date', 'Client', 'Status', 'Source', 'Total', 'Due Date']
    const rows = invoices.map(i => [i.issued_date ?? '', i.client_name, i.status, i.source, i.total.toFixed(2), i.due_date ?? ''])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'invoices.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function exportFullCSV() {
    const invRows = invoices.map(i => ['invoice', i.issued_date ?? '', i.client_name, i.status, i.source, i.total.toFixed(2)])
    const expRows = expenses.map(e => ['expense', e.date, e.description, e.category, '', e.amount.toFixed(2)])
    const headers = ['Type', 'Date', 'Name', 'Status/Category', 'Source', 'Amount']
    const csv = [headers, ...invRows, ...expRows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'full-report.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div style={{ padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading finance data…</p>
      </div>
    )
  }

  const nativeCount = invoices.filter(i => i.source === 'native').length
  const pennylaneCount = invoices.filter(i => i.source === 'pennylane').length
  const pennylaneConnected = integration?.status === 'connected'

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Finance</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <button
              id="export-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)' }}
              onClick={() => {
                const menu = document.getElementById('export-menu')
                if (menu) menu.style.display = menu.style.display === 'none' ? 'flex' : 'none'
              }}
            >
              <Download size={14} /> Export
            </button>
            <div id="export-menu" style={{ display: 'none', flexDirection: 'column', position: 'absolute', right: 0, top: '100%', marginTop: '4px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '180px' }}>
              {[
                { label: 'Export Invoices (CSV)', fn: exportInvoicesCSV },
                { label: 'Export Expenses (CSV)', fn: () => { const menu = document.getElementById('export-menu'); if (menu) menu.style.display = 'none'; document.querySelector<HTMLButtonElement>('[data-export="expenses"]')?.click() } },
                { label: 'Export Full Report (CSV)', fn: exportFullCSV },
              ].map(item => (
                <button key={item.label} onClick={() => { item.fn(); const menu = document.getElementById('export-menu'); if (menu) menu.style.display = 'none' }} style={{ padding: '10px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Data source bar */}
      <DataSourceBar
        pennylaneConnected={pennylaneConnected}
        lastSyncedAt={integration?.last_synced_at ?? null}
        nativeCount={nativeCount}
        pennylaneCount={pennylaneCount}
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
        onSyncNow={handleSyncNow}
      />

      {/* KPI bar */}
      <KPIBar
        invoices={invoices}
        month={month}
        onMonthChange={setMonth}
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
      />

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <RevenueChart invoices={invoices} expenses={expenses} month={month} />
        <CashFlowChart invoices={invoices} />
      </div>

      {/* VAT panel */}
      {business && (
        <VATPanel invoices={invoices} countryCode={business.country_code} />
      )}

      {/* Invoice Kanban */}
      <InvoiceBoard
        invoices={invoices}
        countryCode={business?.country_code ?? 'FR'}
        sourceFilter={sourceFilter}
        onStatusChange={handleStatusChange}
        onCreateInvoice={handleCreateInvoice}
        onImported={load}
      />

      {/* Expense table */}
      {business && (
        <ExpenseTable
          expenses={expenses}
          businessId={business.id}
          onExpenseAdded={exp => setExpenses(prev => [exp, ...prev])}
          onExpenseDeleted={id => setExpenses(prev => prev.filter(e => e.id !== id))}
        />
      )}
    </div>
  )
}
