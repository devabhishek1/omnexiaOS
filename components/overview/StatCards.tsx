import { useTranslations } from 'next-intl'

interface StatCard {
  labelKey: string
  value: string
  deltaKey: string
  deltaCount: number
  accentColor: string
}

export function StatCards() {
  const t = useTranslations('overview')

  const stats: StatCard[] = [
    {
      labelKey: 'unreadMessages',
      value: '24',
      deltaKey: 'todayAdded',
      deltaCount: 3,
      accentColor: 'var(--omnexia-accent)',
    },
    {
      labelKey: 'pendingInvoices',
      value: '€8,420',
      deltaKey: 'todayAdded',
      deltaCount: 3,
      accentColor: 'var(--amber)',
    },
    {
      labelKey: 'activeEmployees',
      value: '12',
      deltaKey: 'onLeave',
      deltaCount: 2,
      accentColor: 'var(--green)',
    },
    {
      labelKey: 'todaysTasks',
      value: '7',
      deltaKey: 'todayUrgent',
      deltaCount: 3,
      accentColor: 'var(--red)',
    },
  ]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
      }}
    >
      {stats.map((stat) => (
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
