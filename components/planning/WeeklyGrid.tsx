'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { startOfWeek, addDays, format, isSameDay, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { X, Trash2, AlertTriangle } from 'lucide-react'

interface Employee { id: string; full_name: string }
interface Shift { id: string; employee_id: string; date: string; start_time: string; end_time: string; notes: string | null }
interface Holiday { country_code: string; date: string; name: string }
interface TimeOff { employee_id: string; start_date: string; end_date: string; status: string }

interface Props {
  employees: Employee[]
  shifts: Shift[]
  holidays: Holiday[]
  timeOff: TimeOff[]
  countryCode: string
  businessId: string
  week: Date
  onShiftsChange: (shifts: Shift[]) => void
}

interface Popover {
  type: 'create' | 'edit'
  employeeId: string
  date: string
  shift?: Shift
  x: number
  y: number
}

export default function WeeklyGrid({ employees, shifts, holidays, timeOff, countryCode, businessId, week, onShiftsChange }: Props) {
  const t = useTranslations('planning')
  const tc = useTranslations('common')
  const DAYS = [t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('sunday')]
  const [popover, setPopover] = useState<Popover | null>(null)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const supabase = createClient()
  const weekStart = startOfWeek(week, { weekStartsOn: 1 })
  const weekDays = DAYS.map((_, i) => addDays(weekStart, i))

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function hasConflict(employeeId: string, date: string, excludeId?: string): boolean {
    return shifts.some(s => s.employee_id === employeeId && s.date === date && s.id !== excludeId)
  }

  function isOnLeave(employeeId: string, date: string): boolean {
    return timeOff.some(t => {
      if (t.employee_id !== employeeId || t.status !== 'approved') return false
      return date >= t.start_date && date <= t.end_date
    })
  }

  function getHoliday(date: string): string | null {
    const h = holidays.find(h => h.country_code.trim() === countryCode.toUpperCase() && h.date === date)
    return h?.name ?? null
  }

  function openCreate(employeeId: string, date: string, e: React.MouseEvent) {
    if (isOnLeave(employeeId, date)) return
    setStartTime('09:00'); setEndTime('17:00'); setNotes('')
    setPopover({ type: 'create', employeeId, date, x: e.clientX, y: e.clientY })
  }

  function openEdit(shift: Shift, e: React.MouseEvent) {
    e.stopPropagation()
    setStartTime(shift.start_time.slice(0, 5))
    setEndTime(shift.end_time.slice(0, 5))
    setNotes(shift.notes ?? '')
    setPopover({ type: 'edit', employeeId: shift.employee_id, date: shift.date, shift, x: e.clientX, y: e.clientY })
  }

  async function handleSave() {
    if (!popover) return
    setSaving(true)
    const { employeeId, date } = popover

    if (popover.type === 'create') {
      if (hasConflict(employeeId, date)) {
        showToast('⚠ ' + t('conflictSameDay'))
        setSaving(false)
        return
      }
      const { data, error } = await supabase.from('shifts').insert({
        business_id: businessId,
        employee_id: employeeId,
        date,
        start_time: startTime,
        end_time: endTime,
        notes: notes || null,
      }).select().single()
      if (!error && data) {
        onShiftsChange([...shifts, data as Shift])
        setPopover(null)
      }
    } else if (popover.shift) {
      if (hasConflict(employeeId, date, popover.shift.id)) {
        showToast('⚠ ' + t('conflictOverlap'))
        setSaving(false)
        return
      }
      const { data, error } = await supabase.from('shifts').update({
        start_time: startTime,
        end_time: endTime,
        notes: notes || null,
      }).eq('id', popover.shift.id).select().single()
      if (!error && data) {
        onShiftsChange(shifts.map(s => s.id === popover.shift!.id ? data as Shift : s))
        setPopover(null)
      }
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!popover?.shift) return
    await supabase.from('shifts').delete().eq('id', popover.shift.id)
    onShiftsChange(shifts.filter(s => s.id !== popover.shift!.id))
    setPopover(null)
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
      {/* Header row */}
      <div style={{ display: 'grid', gridTemplateColumns: '160px repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{t('employee')}</div>
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, new Date())
          const holiday = getHoliday(format(day, 'yyyy-MM-dd'))
          return (
            <div key={i} style={{ padding: '10px 8px', textAlign: 'center', borderLeft: '1px solid var(--border)', backgroundColor: isToday ? 'var(--omnexia-accent-light)' : 'transparent' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: isToday ? 'var(--omnexia-accent)' : 'var(--text-muted)', margin: 0, textTransform: 'uppercase' }}>{DAYS[i]}</p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: isToday ? 'var(--omnexia-accent)' : 'var(--text-primary)', margin: '2px 0 0' }}>{format(day, 'd')}</p>
              {holiday && <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{holiday}</p>}
            </div>
          )
        })}
      </div>

      {/* Employee rows */}
      {employees.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('noEmployees')}</p>
        </div>
      ) : (
        employees.map((emp, ri) => (
          <div key={emp.id} style={{ display: 'grid', gridTemplateColumns: '160px repeat(7, 1fr)', borderBottom: ri < employees.length - 1 ? '1px solid var(--border)' : 'none' }}>
            {/* Name cell */}
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--omnexia-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--omnexia-accent)', flexShrink: 0 }}>
                {emp.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.full_name}</span>
            </div>

            {/* Day cells */}
            {weekDays.map((day, di) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const shift = shifts.find(s => s.employee_id === emp.id && s.date === dateStr)
              const onLeave = isOnLeave(emp.id, dateStr)
              const holiday = getHoliday(dateStr)
              const conflict = shift && hasConflict(emp.id, dateStr, shift.id)

              let cellBg = 'transparent'
              if (holiday) cellBg = '#F3F4F6'
              if (onLeave) cellBg = '#FFFBEB'

              return (
                <div
                  key={di}
                  onClick={!shift ? (e) => openCreate(emp.id, dateStr, e) : undefined}
                  style={{
                    borderLeft: '1px solid var(--border)',
                    padding: '6px',
                    minHeight: '60px',
                    backgroundColor: cellBg,
                    cursor: !shift && !onLeave ? 'pointer' : 'default',
                    position: 'relative',
                  }}
                >
                  {onLeave && !shift && (
                    <span style={{ fontSize: '10px', color: '#D97706', fontWeight: 500, padding: '2px 6px', backgroundColor: '#FEF3C7', borderRadius: '4px' }}>{t('approved')}</span>
                  )}
                  {holiday && !shift && !onLeave && (
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{holiday}</span>
                  )}
                  {shift && (
                    <div
                      onClick={e => openEdit(shift, e)}
                      style={{
                        backgroundColor: conflict ? '#FEE2E2' : 'var(--omnexia-accent)',
                        border: conflict ? '2px solid #DC2626' : 'none',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        color: conflict ? '#DC2626' : '#fff',
                      }}
                    >
                      <p style={{ fontSize: '11px', fontWeight: 600, margin: 0 }}>
                        {conflict && <AlertTriangle size={10} style={{ marginRight: '3px', verticalAlign: 'middle' }} />}
                        {shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)}
                      </p>
                      {shift.notes && <p style={{ fontSize: '10px', margin: '2px 0 0', opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shift.notes}</p>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))
      )}

      {/* Popover */}
      {popover && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100 }}
          onClick={() => setPopover(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: Math.min(popover.y, window.innerHeight - 260),
              left: Math.min(popover.x, window.innerWidth - 260),
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px',
              width: '240px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
              zIndex: 101,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {popover.type === 'create' ? t('addShift') : t('shifts')}
              </span>
              <button onClick={() => setPopover(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                <X size={14} color="var(--text-muted)" />
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px' }}>{format(parseISO(popover.date), 'EEEE, MMM d')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={labelStyle}>{t('startTime')}</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{t('endTime')}</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{t('notes')}</label>
                <input value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('notesPlaceholder')} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ flex: 1, padding: '8px', backgroundColor: 'var(--omnexia-accent)', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                {saving ? tc('sending') : tc('save')}
              </button>
              {popover.type === 'edit' && (
                <button onClick={handleDelete} style={{ padding: '8px 10px', border: '1px solid #FECACA', backgroundColor: '#FEF2F2', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Trash2 size={13} color="#DC2626" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#1F2937', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', zIndex: 200, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {toast}
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '3px' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', boxSizing: 'border-box' }
