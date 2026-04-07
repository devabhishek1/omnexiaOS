'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/layout/Card'
import { SectionTitle } from '@/components/layout/SectionTitle'
import { createClient } from '@/lib/supabase/client'
import { useDashboard } from '@/components/layout/DashboardContext'

// IN  → active employee has a shift assigned today              → green
// LEAVE → active employee has an approved time-off for today    → amber (like planning section)
// OFF → active employee, no shift assigned, no approved leave   → grey
type EmployeeStatus = 'in' | 'leave' | 'off'

interface ShiftInfo {
  start_time: string
  end_time: string
}

interface EmployeeChip {
  id: string
  name: string
  initials: string
  status: EmployeeStatus
  shift: ShiftInfo | null
  leaveReason: string | null
}

const STATUS_COLORS: Record<EmployeeStatus, string> = {
  in: 'var(--green)',
  leave: 'var(--amber)',
  off: 'var(--text-disabled)',
}

const STATUS_BG: Record<EmployeeStatus, string> = {
  in: 'var(--omnexia-accent-light)',
  leave: '#FEF3C7',       // amber-light, matches planning section
  off: 'var(--bg-elevated)',
}

const STATUS_TEXT_COLOR: Record<EmployeeStatus, string> = {
  in: 'var(--omnexia-accent)',
  leave: '#B45309',       // amber-dark, matches planning section
  off: 'var(--text-disabled)',
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function formatTime(t: string): string {
  return t.slice(0, 5)
}

export function WhoIsIn() {
  const t = useTranslations('overview')
  const [employees, setEmployees] = useState<EmployeeChip[]>([])
  const [selected, setSelected] = useState<EmployeeChip | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const { user } = useDashboard()
  const businessId = user.active_business_id ?? user.business_id

  const load = useCallback(async () => {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    const [empRes, shiftRes, leaveRes] = await Promise.all([
      // Only active employees (not invited, not deactivated)
      supabase
        .from('employees')
        .select('id, full_name')
        .eq('business_id', businessId)
        .eq('status', 'active')
        .order('full_name', { ascending: true }),
      // Shifts scheduled for today (with times)
      supabase
        .from('shifts')
        .select('employee_id, start_time, end_time')
        .eq('business_id', businessId)
        .eq('date', today),
      // Only APPROVED time-off requests covering today
      supabase
        .from('time_off_requests')
        .select('employee_id, reason')
        .eq('business_id', businessId)
        .eq('status', 'approved')
        .lte('start_date', today)
        .gte('end_date', today),
    ])

    const empData = empRes.data ?? []

    const shiftMap = new Map<string, ShiftInfo>()
    for (const s of shiftRes.data ?? []) {
      shiftMap.set(s.employee_id, { start_time: s.start_time, end_time: s.end_time })
    }

    const leaveMap = new Map<string, string | null>()
    for (const l of leaveRes.data ?? []) {
      leaveMap.set(l.employee_id, l.reason ?? null)
    }

    const chips: EmployeeChip[] = empData.map((emp) => {
      let status: EmployeeStatus
      if (leaveMap.has(emp.id)) {
        // Approved leave takes priority over a shift
        status = 'leave'
      } else if (shiftMap.has(emp.id)) {
        // Has a shift scheduled today
        status = 'in'
      } else {
        // Active but no shift assigned and no approved leave → OFF
        status = 'off'
      }
      return {
        id: emp.id,
        name: emp.full_name,
        initials: getInitials(emp.full_name),
        status,
        shift: shiftMap.get(emp.id) ?? null,
        leaveReason: leaveMap.get(emp.id) ?? null,
      }
    })

    setEmployees(chips)
  }, [businessId])

  useEffect(() => {
    load()
  }, [load])

  // Realtime: refresh when employees, shifts, or time-off changes
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`whoisin:${businessId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees', filter: `business_id=eq.${businessId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts', filter: `business_id=eq.${businessId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_off_requests', filter: `business_id=eq.${businessId}` }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [businessId, load])

  // Close popover when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setSelected(null)
      }
    }
    if (selected) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [selected])

  const statusLabels: Record<EmployeeStatus, string> = {
    in: t('statusIn'),
    leave: t('statusLeave'),
    off: t('statusOff'),
  }

  return (
    <Card>
      <SectionTitle>{t('whoIsIn')}</SectionTitle>

      {employees.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>—</p>
      ) : (
        <div className="flex items-start flex-wrap" style={{ gap: '16px' }}>
          {employees.map((emp) => (
            <div key={emp.id} style={{ position: 'relative' }}>
              <button
                onClick={() => setSelected(selected?.id === emp.id ? null : emp)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {/* Avatar with coloured ring */}
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: STATUS_BG[emp.status],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: STATUS_TEXT_COLOR[emp.status],
                      letterSpacing: '0.02em',
                      border: `2px solid ${STATUS_COLORS[emp.status]}`,
                      opacity: emp.status === 'off' ? 0.55 : 1,
                    }}
                  >
                    {emp.initials}
                  </div>
                  {/* Status dot */}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '1px',
                      right: '1px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: STATUS_COLORS[emp.status],
                      border: '2px solid var(--bg-surface)',
                    }}
                  />
                </div>

                {/* First name */}
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: emp.status === 'off' ? 'var(--text-disabled)' : 'var(--text-secondary)',
                    textAlign: 'center',
                    maxWidth: '60px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {emp.name.split(' ')[0]}
                </span>

                {/* Status label */}
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: STATUS_COLORS[emp.status],
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {statusLabels[emp.status]}
                </span>
              </button>

              {/* Click popover: shows shift time or leave info */}
              {selected?.id === emp.id && (
                <div
                  ref={popoverRef}
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 10px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    minWidth: '170px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    zIndex: 50,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <p
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: '0 0 6px 0',
                    }}
                  >
                    {emp.name}
                  </p>

                  {/* Status chip */}
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '20px',
                      background: emp.status === 'in' ? '#DCFCE7' : emp.status === 'leave' ? '#FEF3C7' : 'var(--bg-elevated)',
                      color: STATUS_TEXT_COLOR[emp.status],
                      marginBottom: '8px',
                    }}
                  >
                    {statusLabels[emp.status]}
                  </span>

                  {/* Detail line */}
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                    {emp.status === 'in' && emp.shift
                      ? `${formatTime(emp.shift.start_time)} – ${formatTime(emp.shift.end_time)}`
                      : emp.status === 'leave' && emp.leaveReason
                        ? emp.leaveReason
                        : null}
                  </p>

                  {/* Arrow */}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-5px',
                      left: '50%',
                      transform: 'translateX(-50%) rotate(45deg)',
                      width: '8px',
                      height: '8px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderTop: 'none',
                      borderLeft: 'none',
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
