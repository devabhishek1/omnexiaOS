'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useDashboard } from '@/components/layout/DashboardContext'

interface Alert {
  id: string
  type: 'invoice_overdue'
  name: string
  amount: string
  days: number
  href: string
}

export function AlertStrip() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [alerts, setAlerts] = useState<Alert[]>([])
  const t = useTranslations('overview')
  const { user } = useDashboard()
  const businessId = user.active_business_id ?? user.business_id

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('invoices')
        .select('id, client_name, total, due_date')
        .eq('business_id', businessId)
        .eq('status', 'overdue')
        .order('due_date', { ascending: true })

      if (!data) return

      const today = new Date()
      const parsed: Alert[] = data.map((inv) => {
        const due = new Date(inv.due_date)
        const days = Math.max(1, Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))
        return {
          id: inv.id,
          type: 'invoice_overdue',
          name: inv.client_name,
          amount: inv.total.toLocaleString('en-EU', { maximumFractionDigits: 0 }),
          days,
          href: '/finance',
        }
      })
      setAlerts(parsed)
    }
    load()
  }, [businessId])

  const visible = alerts.filter((a) => !dismissed.has(a.id))
  if (visible.length === 0) return null

  return (
    <div
      style={{
        background: 'var(--amber-light)',
        borderBottom: '1px solid var(--amber)',
      }}
    >
      {visible.map((alert) => (
        <div
          key={alert.id}
          className="flex items-center gap-3"
          style={{ padding: '10px 28px' }}
        >
          <AlertTriangle
            size={15}
            style={{ color: 'var(--amber)', flexShrink: 0 }}
          />
          <span
            style={{
              fontSize: '13px',
              color: '#92400E',
              flex: 1,
              fontWeight: 500,
            }}
          >
            {t('invoiceOverdueAlert', { name: alert.name, amount: alert.amount, days: alert.days })}
          </span>
          <a
            href={alert.href}
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--amber)',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              border: '1px solid var(--amber)',
              padding: '3px 10px',
              borderRadius: '6px',
            }}
          >
            {t('alertView')}
          </a>
          <button
            onClick={() => setDismissed((prev) => new Set([...prev, alert.id]))}
            aria-label={t('alertDismiss')}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              color: '#92400E',
              opacity: 0.6,
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
