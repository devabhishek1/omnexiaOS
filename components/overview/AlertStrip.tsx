'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle, X } from 'lucide-react'

interface Alert {
  id: string
  type: 'invoice_overdue' | 'urgent_message' | 'shift_conflict'
  message: string
  href: string
}

const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    type: 'invoice_overdue',
    message: 'Invoice #TechParis — €4,220 is 9 days overdue.',
    href: '/finance',
  },
]

export function AlertStrip() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const t = useTranslations('overview')

  const visible = MOCK_ALERTS.filter((a) => !dismissed.has(a.id))

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
            {alert.message}
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
