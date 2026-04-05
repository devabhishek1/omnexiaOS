'use client'

import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { startOfWeek, endOfWeek, format, addWeeks, subWeeks } from 'date-fns'

interface Props {
  week: Date
  view: 'weekly' | 'monthly'
  onWeekChange: (d: Date) => void
  onViewChange: (v: 'weekly' | 'monthly') => void
  onExport: () => void
}

export default function WeekNavigator({ week, view, onWeekChange, onViewChange, onExport }: Props) {
  const t = useTranslations('planning')
  const tc = useTranslations('common')
  const start = startOfWeek(week, { weekStartsOn: 1 })
  const end = endOfWeek(week, { weekStartsOn: 1 })
  const label = t('weekOf', { start: format(start, 'MMM d'), end: format(end, 'MMM d, yyyy') })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      {/* View toggle */}
      <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        {(['weekly', 'monthly'] as const).map(v => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: view === v ? 600 : 400,
              backgroundColor: view === v ? 'var(--omnexia-accent)' : 'transparent',
              color: view === v ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {v === 'weekly' ? t('weekly') : t('monthly')}
          </button>
        ))}
      </div>

      {/* Week navigation (only in weekly view) */}
      {view === 'weekly' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => onWeekChange(subWeeks(week, 1))} style={navBtnStyle}>
            <ChevronLeft size={14} color="var(--text-secondary)" />
          </button>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', minWidth: '220px', textAlign: 'center' }}>{label}</span>
          <button onClick={() => onWeekChange(addWeeks(week, 1))} style={navBtnStyle}>
            <ChevronRight size={14} color="var(--text-secondary)" />
          </button>
          <button
            onClick={() => onWeekChange(new Date())}
            style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'none', fontSize: '12px', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            {tc('today')}
          </button>
        </div>
      )}

      <div style={{ marginLeft: 'auto' }}>
        <button
          onClick={onExport}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)' }}
        >
          <Download size={13} /> {t('exportCSV')}
        </button>
      </div>
    </div>
  )
}

const navBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  padding: '4px 6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
}
