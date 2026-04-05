'use client'

import { useTranslations } from 'next-intl'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'

interface Props {
  pennylaneConnected: boolean
  lastSyncedAt: string | null
  nativeCount: number
  pennylaneCount: number
  sourceFilter: 'all' | 'native' | 'pennylane'
  onSourceFilterChange: (f: 'all' | 'native' | 'pennylane') => void
  onSyncNow: () => Promise<void>
}

export default function DataSourceBar({
  pennylaneConnected,
  lastSyncedAt,
  nativeCount,
  pennylaneCount,
  sourceFilter,
  onSourceFilterChange,
  onSyncNow,
}: Props) {
  const [syncing, setSyncing] = useState(false)
  const t = useTranslations('finance')
  const tc = useTranslations('common')

  async function handleSync() {
    setSyncing(true)
    await onSyncNow().catch(() => null)
    setSyncing(false)
  }

  const filters: Array<{ key: 'all' | 'native' | 'pennylane'; label: string }> = [
    { key: 'all', label: t('invoices') },
    { key: 'native', label: 'Native' },
    ...(pennylaneConnected ? [{ key: 'pennylane' as const, label: 'Pennylane' }] : []),
  ]

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '8px 16px',
      backgroundColor: 'var(--bg-elevated)',
      borderRadius: '8px',
      fontSize: '13px',
      flexWrap: 'wrap',
    }}>
      {/* Source status */}
      {pennylaneConnected ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--green)', display: 'inline-block' }} />
          <span style={{ color: 'var(--text-secondary)' }}>
            {t('pennylaneConnected')}
            {lastSyncedAt && (
              <span style={{ color: 'var(--text-muted)' }}>
                {' · Last sync: '}
                {new Date(lastSyncedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </span>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '2px 8px', fontSize: '12px', color: 'var(--text-secondary)', cursor: syncing ? 'not-allowed' : 'pointer', opacity: syncing ? 0.6 : 1 }}
          >
            <RefreshCw size={11} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            {syncing ? tc('sending') : tc('refresh')}
          </button>
        </div>
      ) : (
        <a href="/settings?tab=integrations" style={{ color: 'var(--omnexia-accent)', textDecoration: 'none', fontWeight: 500 }}>
          {t('pennylaneConnect')} →
        </a>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Counts */}
        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
          {nativeCount} native{pennylaneConnected ? ` · ${pennylaneCount} Pennylane` : ''}
        </span>

        {/* Source filter pills */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => onSourceFilterChange(f.key)}
              style={{
                padding: '3px 10px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: sourceFilter === f.key ? 'var(--omnexia-accent)' : 'var(--border)',
                backgroundColor: sourceFilter === f.key ? 'var(--omnexia-accent-light)' : 'transparent',
                color: sourceFilter === f.key ? 'var(--omnexia-accent)' : 'var(--text-secondary)',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: sourceFilter === f.key ? 600 : 400,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
