'use client'

import { AIBadge } from '@/components/layout/AIBadge'

export function DigestCard() {
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div
      style={{
        background: 'var(--dark-card)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '0',
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
        <div className="flex items-center gap-2">
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--dark-card-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            ✦ AI DIGEST — {today.toUpperCase()}
          </span>
          <AIBadge />
        </div>
        <button
          style={{
            background: 'var(--dark-card-surface)',
            border: '1px solid #3A3A3A',
            borderRadius: '8px',
            padding: '6px 14px',
            color: 'var(--dark-card-muted)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = 'var(--dark-card-text)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = 'var(--dark-card-muted)')
          }
        >
          Regenerate →
        </button>
      </div>

      {/* Body */}
      <p
        style={{
          fontSize: '15px',
          lineHeight: 1.6,
          color: 'var(--dark-card-text)',
          maxWidth: '580px',
          margin: '0 0 20px 0',
        }}
      >
        You have{' '}
        <strong style={{ color: '#93C5FD' }}>24 unread messages</strong>, 3
        urgent. The{' '}
        <strong style={{ color: '#93C5FD' }}>TechParis invoice</strong> is 9
        days overdue. Marc Petit is on leave until April 2
        {' '}— consider reassigning their support tickets.
      </p>

      {/* Footer row */}
      <div
        className="flex items-center gap-6"
        style={{
          borderTop: '1px solid #2A2A2A',
          paddingTop: '16px',
        }}
      >
        <span style={{ fontSize: '12px', color: 'var(--dark-card-subtle)' }}>
          <span style={{ color: 'var(--gmail)', fontWeight: 600 }}>●</span>{' '}
          Gmail{' '}
          <span style={{ color: 'var(--dark-card-muted)' }}>18 msgs</span>
        </span>
        <span style={{ fontSize: '12px', color: 'var(--dark-card-subtle)' }}>
          <span style={{ color: 'var(--instagram)', fontWeight: 600 }}>●</span>{' '}
          Instagram{' '}
          <span style={{ color: 'var(--dark-card-muted)' }}>4 msgs</span>
        </span>
        <span style={{ fontSize: '12px', color: 'var(--dark-card-subtle)' }}>
          <span style={{ color: 'var(--facebook)', fontWeight: 600 }}>●</span>{' '}
          Facebook{' '}
          <span style={{ color: 'var(--dark-card-muted)' }}>2 msgs</span>
        </span>
      </div>
    </div>
  )
}
