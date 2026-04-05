'use client'

import { useTranslations } from 'next-intl'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth, isSameDay, isSameWeek } from 'date-fns'

interface Shift { employee_id: string; date: string }
interface Holiday { country_code: string; date: string; name: string }

interface Props {
  month: Date
  shifts: Shift[]
  holidays: Holiday[]
  countryCode: string
  onMonthChange: (d: Date) => void
  onDayClick: (day: Date) => void
}

export default function MonthlyCalendar({ month, shifts, holidays, countryCode, onMonthChange, onDayClick }: Props) {
  const t = useTranslations('planning')
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days: Date[] = []
  let d = calStart
  while (d <= calEnd) { days.push(d); d = addDays(d, 1) }

  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  function getShiftCount(day: Date): number {
    const dateStr = format(day, 'yyyy-MM-dd')
    return shifts.filter(s => s.date === dateStr).length
  }

  function getHoliday(day: Date): string | null {
    const dateStr = format(day, 'yyyy-MM-dd')
    return holidays.find(h => h.country_code.trim() === countryCode.toUpperCase() && h.date === dateStr)?.name ?? null
  }

  const DAY_NAMES = [t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('sunday')]
  const monthLabel = format(month, 'MMMM yyyy')

  return (
    <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
      {/* Month header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => { const d = new Date(month); d.setMonth(d.getMonth() - 1); onMonthChange(d) }} style={navBtn}>‹</button>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{monthLabel}</span>
        <button onClick={() => { const d = new Date(month); d.setMonth(d.getMonth() + 1); onMonthChange(d) }} style={navBtn}>›</button>
      </div>

      {/* Day names */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
        {DAY_NAMES.map(n => (
          <div key={n} style={{ padding: '8px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{n}</div>
        ))}
      </div>

      {/* Calendar grid */}
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: wi < weeks.length - 1 ? '1px solid var(--border)' : 'none' }}>
          {week.map((day, di) => {
            const inMonth = isSameMonth(day, month)
            const isToday = isSameDay(day, new Date())
            const shiftCount = getShiftCount(day)
            const holiday = getHoliday(day)

            return (
              <div
                key={di}
                onClick={() => onDayClick(day)}
                style={{
                  padding: '10px 8px',
                  minHeight: '72px',
                  borderLeft: di > 0 ? '1px solid var(--border)' : 'none',
                  backgroundColor: isToday ? 'var(--omnexia-accent-light)' : holiday ? '#F9FAFB' : 'transparent',
                  cursor: 'pointer',
                  opacity: inMonth ? 1 : 0.35,
                }}
              >
                <p style={{
                  fontSize: '13px',
                  fontWeight: isToday ? 700 : 400,
                  margin: '0 0 4px',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  backgroundColor: isToday ? 'var(--omnexia-accent)' : 'transparent',
                  color: isToday ? '#fff' : 'var(--text-primary)',
                }}>
                  {format(day, 'd')}
                </p>
                {shiftCount > 0 && (
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--omnexia-accent)', color: '#fff' }}>
                    {shiftCount} shift{shiftCount > 1 ? 's' : ''}
                  </span>
                )}
                {holiday && (
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{holiday}</p>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

const navBtn: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  width: '28px',
  height: '28px',
  cursor: 'pointer',
  fontSize: '16px',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
