'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useDashboard } from '@/components/layout/DashboardContext'
import { Skeleton } from '@/components/ui/skeleton'

interface Stats {
  unreadConversations: number
  newConversationsToday: number
  pendingTotal: number
  pendingCount: number
  totalEmployees: number
  onLeaveToday: number
  shiftsToday: number
}

function formatEuro(val: number): string {
  if (val >= 1000) {
    const k = val / 1000
    return `€${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`
  }
  return `€${val}`
}

export function StatCards() {
  const t = useTranslations('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const { user } = useDashboard()
  const businessId = user.active_business_id ?? user.business_id

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]
      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)

      const [unreadRes, newConvRes, invRes, empRes, leaveRes, shiftRes] = await Promise.all([
        // Unread conversations
        supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .eq('status', 'unread'),
        // New conversations today
        supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .gte('last_message_at', startOfToday.toISOString()),
        // Pending/unpaid invoices
        supabase
          .from('invoices')
          .select('total')
          .eq('business_id', businessId)
          .in('status', ['unpaid', 'sent']),
        // Active employees only (excludes invited + deactivated)
        supabase
          .from('employees')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .eq('status', 'active'),
        // On leave today (approved time-off covering today)
        supabase
          .from('time_off_requests')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .eq('status', 'approved')
          .lte('start_date', today)
          .gte('end_date', today),
        // Shifts today
        supabase
          .from('shifts')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .eq('date', today),
      ])

      const pendingTotal = (invRes.data ?? []).reduce((sum, inv) => sum + (inv.total ?? 0), 0)

      setStats({
        unreadConversations: unreadRes.count ?? 0,
        newConversationsToday: newConvRes.count ?? 0,
        pendingTotal,
        pendingCount: invRes.data?.length ?? 0,
        totalEmployees: empRes.count ?? 0,
        onLeaveToday: leaveRes.count ?? 0,
        shiftsToday: shiftRes.count ?? 0,
      })
    }
    load()
  }, [businessId])

  const cards = [
    {
      labelKey: 'unreadMessages',
      value: stats ? String(stats.unreadConversations) : '—',
      deltaKey: 'todayAdded' as const,
      deltaCount: stats?.newConversationsToday ?? 0,
      accentColor: 'var(--omnexia-accent)',
    },
    {
      labelKey: 'pendingInvoices',
      value: stats ? formatEuro(stats.pendingTotal) : '—',
      deltaKey: 'todayAdded' as const,
      deltaCount: stats?.pendingCount ?? 0,
      accentColor: 'var(--amber)',
    },
    {
      labelKey: 'activeEmployees',
      value: stats ? String(stats.totalEmployees) : '—',
      deltaKey: 'onLeave' as const,
      deltaCount: stats?.onLeaveToday ?? 0,
      accentColor: 'var(--green)',
    },
    {
      labelKey: 'todaysTasks',
      value: stats ? String(stats.shiftsToday) : '—',
      deltaKey: 'todayUrgent' as const,
      deltaCount: 0,
      accentColor: 'var(--red)',
    },
  ]

  if (!stats) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          'var(--omnexia-accent)',
          'var(--amber)',
          'var(--green)',
          'var(--red)',
        ].map((accentColor, i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: '12px',
              padding: '20px',
              borderLeft: `3px solid ${accentColor}`,
            }}
          >
            <Skeleton style={{ width: '70%', height: '11px', marginBottom: '14px', borderRadius: '4px' }} />
            <Skeleton style={{ width: '48px', height: '28px', marginBottom: '10px', borderRadius: '4px' }} />
            <Skeleton style={{ width: '55%', height: '12px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
      }}
    >
      {cards.map((stat) => (
        <div
          key={stat.labelKey}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            padding: '20px 20px 20px 20px',
            borderLeft: `3px solid ${stat.accentColor}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle tinted top-right accent glow */}
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: stat.accentColor,
              opacity: 0.06,
              pointerEvents: 'none',
            }}
          />

          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: '0 0 10px 0',
            }}
          >
            {t(stat.labelKey)}
          </p>
          <p
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 6px 0',
              lineHeight: 1.2,
            }}
          >
            {stat.value}
          </p>
          <p
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: stat.accentColor,
              margin: 0,
            }}
          >
            {t(stat.deltaKey, { count: stat.deltaCount })}
          </p>
        </div>
      ))}
    </div>
  )
}
