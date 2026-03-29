interface StatCard {
  label: string
  value: string
  delta: string
  accentColor: string
}

const stats: StatCard[] = [
  {
    label: 'Unread Messages',
    value: '24',
    delta: '+3 today',
    accentColor: 'var(--omnexia-accent)',
  },
  {
    label: 'Pending Invoices',
    value: '€8,420',
    delta: '3 invoices',
    accentColor: 'var(--amber)',
  },
  {
    label: 'Active Employees',
    value: '12',
    delta: '2 on leave',
    accentColor: 'var(--green)',
  },
  {
    label: "Today's Tasks",
    value: '7',
    delta: '3 urgent',
    accentColor: 'var(--red)',
  },
]

export function StatCards() {
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
          key={stat.label}
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
            {stat.label}
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
            {stat.delta}
          </p>
        </div>
      ))}
    </div>
  )
}
