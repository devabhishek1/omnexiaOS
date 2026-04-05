'use client'

import { useTranslations } from 'next-intl'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Invoice { total: number; status: string; issued_date: string | null }
interface Expense { amount: number; date: string }

interface Props {
  invoices: Invoice[]
  expenses: Expense[]
  month: Date
}

export default function RevenueChart({ invoices, expenses, month }: Props) {
  const t = useTranslations('finance')
  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5']
  const data = weeks.map(w => {
    const weekNum = parseInt(w.replace('W', ''))
    const startDay = (weekNum - 1) * 7 + 1
    const endDay = Math.min(weekNum * 7, 31)

    const revenue = invoices
      .filter(inv => {
        if (inv.status !== 'paid' || !inv.issued_date) return false
        const d = new Date(inv.issued_date)
        return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth() && d.getDate() >= startDay && d.getDate() <= endDay
      })
      .reduce((s, i) => s + (i.total ?? 0), 0)

    const expense = expenses
      .filter(e => {
        const d = new Date(e.date)
        return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth() && d.getDate() >= startDay && d.getDate() <= endDay
      })
      .reduce((s, e) => s + (e.amount ?? 0), 0)

    const revenueLabel = t('legendRevenue')
    const expensesLabel = t('legendExpenses')
    return { week: w, [revenueLabel]: Math.round(revenue), [expensesLabel]: Math.round(expense) }
  })

  const revenueLabel = t('legendRevenue')
  const expensesLabel = t('legendExpenses')

  return (
    <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', padding: '20px 24px', border: '1px solid var(--border)' }}>
      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', margin: '0 0 16px' }}>{t('revenueVsExpenses')}</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barGap={4}>
          <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} width={50} />
          <Tooltip formatter={(v) => [`€${Number(v).toLocaleString()}`, '']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey={revenueLabel} fill="#22C55E" radius={[4, 4, 0, 0]} />
          <Bar dataKey={expensesLabel} fill="#EF4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
