'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/layout/Card'
import { SectionTitle } from '@/components/layout/SectionTitle'
import { Badge } from '@/components/layout/Badge'
import { createClient } from '@/lib/supabase/client'
import { useDashboard } from '@/components/layout/DashboardContext'

interface InvoiceRow {
  id: string
  client: string
  date: string
  amount: string
  status: 'paid' | 'pending' | 'overdue'
}

interface FinanceData {
  revenue: number
  expenses: number
  recentInvoices: InvoiceRow[]
}

const statusVariant: Record<InvoiceRow['status'], 'success' | 'warning' | 'error'> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'error',
}

function formatEuro(val: number): string {
  return `€${val.toLocaleString('en-EU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function mapInvoiceStatus(status: string): InvoiceRow['status'] {
  if (status === 'paid') return 'paid'
  if (status === 'overdue') return 'overdue'
  return 'pending'
}

export function FinanceSnapshot() {
  const t = useTranslations('finance')
  const to = useTranslations('overview')
  const [data, setData] = useState<FinanceData | null>(null)
  const { user } = useDashboard()
  const businessId = user.active_business_id ?? user.business_id

  const currentMonth = new Date().toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

      const [invRes, expRes, recentRes] = await Promise.all([
        // Paid invoices this month for revenue
        supabase
          .from('invoices')
          .select('total')
          .eq('business_id', businessId)
          .eq('status', 'paid')
          .gte('issued_date', monthStart.split('T')[0])
          .lte('issued_date', monthEnd.split('T')[0]),
        // Expenses this month
        supabase
          .from('expenses')
          .select('amount')
          .eq('business_id', businessId)
          .gte('date', monthStart.split('T')[0])
          .lte('date', monthEnd.split('T')[0]),
        // 3 most recent invoices
        supabase
          .from('invoices')
          .select('id, client_name, issued_date, total, status')
          .eq('business_id', businessId)
          .order('issued_date', { ascending: false })
          .limit(3),
      ])

      const revenue = (invRes.data ?? []).reduce((sum, inv) => sum + (inv.total ?? 0), 0)
      const expenses = (expRes.data ?? []).reduce((sum, exp) => sum + (exp.amount ?? 0), 0)

      const recentInvoices: InvoiceRow[] = (recentRes.data ?? []).map((inv) => ({
        id: inv.id,
        client: inv.client_name,
        date: new Date(inv.issued_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
        amount: formatEuro(inv.total),
        status: mapInvoiceStatus(inv.status),
      }))

      setData({ revenue, expenses, recentInvoices })
    }
    load()
  }, [businessId])

  const statusLabel: Record<InvoiceRow['status'], string> = {
    paid: t('paid'),
    pending: t('pending'),
    overdue: t('overdue'),
  }

  return (
    <Card>
      <SectionTitle>{to('financeSnapshot')} — {currentMonth.toUpperCase()}</SectionTitle>

      {/* 3 metric columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              margin: '0 0 4px 0',
            }}
          >
            {t('revenue')}
          </p>
          <p
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--green)',
              margin: 0,
            }}
          >
            {data ? formatEuro(data.revenue) : '—'}
          </p>
        </div>
        <div>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              margin: '0 0 4px 0',
            }}
          >
            {t('expenses')}
          </p>
          <p
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--red)',
              margin: 0,
            }}
          >
            {data ? formatEuro(data.expenses) : '—'}
          </p>
        </div>
        <div>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              margin: '0 0 4px 0',
            }}
          >
            {t('total')}
          </p>
          <p
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {data ? formatEuro(data.revenue - data.expenses) : '—'}
          </p>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-default)', margin: '0 0 20px 0' }} />

      <SectionTitle>{t('invoices')}</SectionTitle>
      <div className="flex flex-col" style={{ gap: '12px' }}>
        {!data ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>—</p>
        ) : data.recentInvoices.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            {t('noInvoices')}
          </p>
        ) : (
          data.recentInvoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between"
            >
              <div>
                <p
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    margin: '0 0 2px 0',
                  }}
                >
                  {inv.client}
                </p>
                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    margin: 0,
                  }}
                >
                  {inv.date}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {inv.amount}
                </span>
                <Badge label={statusLabel[inv.status]} variant={statusVariant[inv.status]} />
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
