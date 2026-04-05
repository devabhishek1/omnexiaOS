'use client'

import { useTranslations } from 'next-intl'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface Invoice { total: number; status: string; due_date: string | null }

interface Props {
  invoices: Invoice[]
}

export default function CashFlowChart({ invoices }: Props) {
  const t = useTranslations('finance')
  const today = new Date()
  const data: { date: string; cashPosition: number }[] = []

  // Build 30-day projected cash flow from unpaid/sent invoices
  let running = 0
  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

    const incoming = invoices
      .filter(inv => (inv.status === 'unpaid' || inv.status === 'sent') && inv.due_date === dateStr)
      .reduce((s, inv) => s + (inv.total ?? 0), 0)

    running += incoming
    data.push({ date: label, cashPosition: Math.round(running) })
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', padding: '20px 24px', border: '1px solid var(--border)' }}>
      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>{t('projectedCashFlow')}</p>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px' }}>{t('cashFlowSubtitle')}</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval={4} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} width={55} />
          <Tooltip formatter={(v) => [`€${Number(v).toLocaleString()}`, 'Cash position']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} />
          <ReferenceLine y={0} stroke="var(--border-strong)" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="cashPosition" stroke="var(--omnexia-accent)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
