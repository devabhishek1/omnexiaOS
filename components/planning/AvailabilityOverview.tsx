'use client'

import { useTranslations } from 'next-intl'
import { startOfWeek, addDays, format } from 'date-fns'

interface Employee { id: string; full_name: string }
interface Shift { employee_id: string; date: string; start_time: string; end_time: string }
interface TimeOff { employee_id: string; start_date: string; end_date: string; status: string }

interface Props {
  employees: Employee[]
  shifts: Shift[]
  timeOff: TimeOff[]
  week: Date
}

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h + m / 60
}

function shiftHours(s: Shift): number {
  return Math.max(0, parseTime(s.end_time) - parseTime(s.start_time))
}

export default function AvailabilityOverview({ employees, shifts, timeOff, week }: Props) {
  const t = useTranslations('planning')
  const weekStart = startOfWeek(week, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'))
  const DAY_LABELS = [t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('sunday')]

  if (employees.length === 0) return null

  return (
    <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '20px 24px' }}>
      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px' }}>{t('teamAvailability')}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {employees.map(emp => {
          const days = weekDays.map(date => {
            const onLeave = timeOff.some(to => to.employee_id === emp.id && to.status === 'approved' && date >= to.start_date && date <= to.end_date)
            if (onLeave) return 'leave'
            const shift = shifts.find(s => s.employee_id === emp.id && s.date === date)
            if (!shift) return 'off'
            return shiftHours(shift) >= 4 ? 'full' : 'partial'
          })

          const full = days.filter(d => d === 'full').length
          const partial = days.filter(d => d === 'partial').length
          const leave = days.filter(d => d === 'leave').length

          return (
            <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', width: '140px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.full_name}</span>
              <div style={{ flex: 1, display: 'flex', gap: '3px', height: '20px' }}>
                {days.map((status, i) => (
                  <div
                    key={i}
                    title={DAY_LABELS[i]}
                    style={{
                      flex: 1,
                      borderRadius: '3px',
                      backgroundColor:
                        status === 'full' ? '#22C55E' :
                        status === 'partial' ? '#F59E0B' :
                        status === 'leave' ? '#FEF3C7' :
                        'var(--bg-elevated)',
                      border: status === 'leave' ? '1px solid #FDE68A' : 'none',
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                <span style={{ color: '#22C55E' }}>{t('daysCount', { count: full })}</span>
                {partial > 0 && <span style={{ color: '#F59E0B' }}>{t('partialCount', { count: partial })}</span>}
                {leave > 0 && <span>🏖 {t('leaveDays', { count: leave })}</span>}
              </div>
            </div>
          )
        })}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '14px', fontSize: '11px', color: 'var(--text-muted)' }}>
        {([['#22C55E', t('fullShift')], ['#F59E0B', t('partialShift')], ['#FEF3C7', t('onLeave')], ['var(--bg-elevated)', t('off')]] as [string, string][]).map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: color, border: color === 'var(--bg-elevated)' ? '1px solid var(--border)' : 'none' }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
