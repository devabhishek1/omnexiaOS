'use client'

import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Invoice {
  total: number
  status: string
  source: string
  issued_date: string | null
}

interface Props {
  invoices: Invoice[]
  month: Date
  onMonthChange: (d: Date) => void
  sourceFilter: 'all' | 'native' | 'pennylane'
  onSourceFilterChange: (f: 'all' | 'native' | 'pennylane') => void
}

function fmt(n: number, currency = 'EUR') {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(n)
}

export default function KPIBar({ invoices, month, onMonthChange, sourceFilter, onSourceFilterChange }: Props) {
  const t = useTranslations('finance')
  const filtered = invoices.filter(inv => {
    if (sourceFilter !== 'all' && inv.source !== sourceFilter) return false
    if (!inv.issued_date) return true
    const d = new Date(inv.issued_date)
    return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth()
  })

  const revenue = filtered.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total ?? 0), 0)
  const pending = filtered.filter(i => i.status === 'unpaid' || i.status === 'sent').reduce((s, i) => s + (i.total ?? 0), 0)
  const overdueInvoices = filtered.filter(i => i.status === 'overdue')
  const overdue = overdueInvoices.reduce((s, i) => s + (i.total ?? 0), 0)

  const monthLabel = month.toLocaleString(undefined, { month: 'long', year: 'numeric' })

  function prevMonth() { const d = new Date(month); d.setMonth(d.getMonth() - 1); onMonthChange(d) }
  function nextMonth() { const d = new Date(month); d.setMonth(d.getMonth() + 1); onMonthChange(d) }

  const tiles = [
    { label: t('revenue'), value: fmt(revenue), color: 'var(--green)', bg: 'var(--green-light)', badge: null },
    { label: t('pending'), value: fmt(pending), color: '#D97706', bg: '#FFFBEB', badge: null },
    { label: t('overdue'), value: fmt(overdue), color: '#DC2626', bg: '#FEF2F2', badge: overdueInvoices.length > 0 ? overdueInvoices.length : null },
  ]

  return (
    <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', padding: '20px 24px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        {/* Month selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={prevMonth} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={14} color="var(--text-secondary)" />
          </button>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', minWidth: '120px', textAlign: 'center' }}>{monthLabel}</span>
          <button onClick={nextMonth} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ChevronRight size={14} color="var(--text-secondary)" />
          </button>
        </div>

        {/* Source filter */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['all', 'native', 'pennylane'] as const).map(s => (
            <button
              key={s}
              onClick={() => onSourceFilterChange(s)}
              style={{ padding: '3px 10px', borderRadius: '20px', border: '1px solid', borderColor: sourceFilter === s ? 'var(--omnexia-accent)' : 'var(--border)', backgroundColor: sourceFilter === s ? 'var(--omnexia-accent-light)' : 'transparent', color: sourceFilter === s ? 'var(--omnexia-accent)' : 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', fontWeight: sourceFilter === s ? 600 : 400, textTransform: 'capitalize' }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {tiles.map(t => (
          <div key={t.label} style={{ backgroundColor: t.bg, borderRadius: '10px', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{t.label}</span>
              {t.badge !== null && (
                <span style={{ backgroundColor: '#DC2626', color: '#fff', borderRadius: '20px', padding: '1px 7px', fontSize: '11px', fontWeight: 700 }}>{t.badge}</span>
              )}
            </div>
            <p style={{ fontSize: '22px', fontWeight: 700, color: t.color, margin: 0, letterSpacing: '-0.02em' }}>{t.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
