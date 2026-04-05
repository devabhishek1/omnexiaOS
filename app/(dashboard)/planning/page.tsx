'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { startOfWeek, endOfWeek, format } from 'date-fns'
import WeekNavigator from '@/components/planning/WeekNavigator'
import WeeklyGrid from '@/components/planning/WeeklyGrid'
import MonthlyCalendar from '@/components/planning/MonthlyCalendar'
import AvailabilityOverview from '@/components/planning/AvailabilityOverview'
import TimeOffPanel from '@/components/planning/TimeOffPanel'

interface Employee { id: string; full_name: string; user_id: string | null }
interface Shift { id: string; employee_id: string; date: string; start_time: string; end_time: string; notes: string | null }
interface Holiday { country_code: string; date: string; name: string }
interface TimeOffRequest { id: string; employee_id: string; start_date: string; end_date: string; reason: string | null; status: string; created_at: string }

export default function PlanningPage() {
  const t = useTranslations('planning')
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly')
  const [week, setWeek] = useState(new Date())
  const [month, setMonth] = useState(new Date())
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [timeOff, setTimeOff] = useState<TimeOffRequest[]>([])
  const [businessId, setBusinessId] = useState('')
  const [countryCode, setCountryCode] = useState('FR')
  const [currentUserId, setCurrentUserId] = useState('')
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    const { data: userRow } = await supabase.from('users').select('business_id').eq('id', user.id).single()
    if (!userRow?.business_id) return
    setBusinessId(userRow.business_id)

    const { data: biz } = await supabase.from('businesses').select('country_code').eq('id', userRow.business_id).single()
    const cc = biz?.country_code?.trim() ?? 'FR'
    setCountryCode(cc)

    const weekStart = startOfWeek(week, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(week, { weekStartsOn: 1 })

    const [empRes, shiftRes, holidayRes, toRes] = await Promise.all([
      supabase.from('employees').select('id, full_name, user_id').eq('business_id', userRow.business_id),
      supabase.from('shifts').select('*').eq('business_id', userRow.business_id)
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd')),
      supabase.from('public_holidays').select('*').eq('country_code', cc),
      supabase.from('time_off_requests').select('*').eq('business_id', userRow.business_id),
    ])

    if (empRes.data) {
      setEmployees(empRes.data)
      const me = empRes.data.find(e => e.user_id === user.id)
      setCurrentEmployeeId(me?.id ?? null)
    }
    if (shiftRes.data) setShifts(shiftRes.data)
    if (holidayRes.data) setHolidays(holidayRes.data)
    if (toRes.data) setTimeOff(toRes.data)
    setLoading(false)
  }, [supabase, week])

  useEffect(() => { load() }, [load])

  const reloadShifts = useCallback(async () => {
    if (!businessId) return
    const weekStart = startOfWeek(week, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(week, { weekStartsOn: 1 })
    const { data } = await supabase.from('shifts').select('*').eq('business_id', businessId)
      .gte('date', format(weekStart, 'yyyy-MM-dd'))
      .lte('date', format(weekEnd, 'yyyy-MM-dd'))
    if (data) setShifts(data)
  }, [supabase, businessId, week])

  useEffect(() => {
    if (businessId) reloadShifts()
  }, [week, businessId, reloadShifts])

  // Realtime — keep shifts + time-off in sync across tabs/devices
  useEffect(() => {
    if (!businessId) return
    const channel = supabase
      .channel(`planning:${businessId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts', filter: `business_id=eq.${businessId}` }, payload => {
        if (payload.eventType === 'INSERT') setShifts(prev => [...prev, payload.new as Shift])
        if (payload.eventType === 'UPDATE') setShifts(prev => prev.map(s => s.id === payload.new.id ? payload.new as Shift : s))
        if (payload.eventType === 'DELETE') setShifts(prev => prev.filter(s => s.id !== payload.old.id))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_off_requests', filter: `business_id=eq.${businessId}` }, payload => {
        if (payload.eventType === 'INSERT') setTimeOff(prev => [...prev, payload.new as TimeOffRequest])
        if (payload.eventType === 'UPDATE') setTimeOff(prev => prev.map(t => t.id === payload.new.id ? payload.new as TimeOffRequest : t))
        if (payload.eventType === 'DELETE') setTimeOff(prev => prev.filter(t => t.id !== payload.old.id))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [businessId, supabase])

  function handleDayClick(day: Date) {
    setWeek(day)
    setView('weekly')
  }

  function exportCSV() {
    const headers = ['Employee', 'Date', 'Start Time', 'End Time', 'Notes']
    const rows = shifts.map(s => {
      const emp = employees.find(e => e.id === s.employee_id)
      return [emp?.full_name ?? '', s.date, s.start_time.slice(0, 5), s.end_time.slice(0, 5), s.notes ?? '']
    })
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `schedule-${format(week, 'yyyy-MM-dd')}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div style={{ padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('loadingSchedule')}</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>{t('title')}</h1>

      <WeekNavigator
        week={week}
        view={view}
        onWeekChange={setWeek}
        onViewChange={setView}
        onExport={exportCSV}
      />

      {view === 'weekly' ? (
        <WeeklyGrid
          employees={employees}
          shifts={shifts}
          holidays={holidays}
          timeOff={timeOff}
          countryCode={countryCode}
          businessId={businessId}
          week={week}
          onShiftsChange={setShifts}
        />
      ) : (
        <MonthlyCalendar
          month={month}
          shifts={shifts}
          holidays={holidays}
          countryCode={countryCode}
          onMonthChange={setMonth}
          onDayClick={handleDayClick}
        />
      )}

      <AvailabilityOverview
        employees={employees}
        shifts={shifts}
        timeOff={timeOff}
        week={week}
      />

      <TimeOffPanel
        requests={timeOff}
        employees={employees}
        currentUserId={currentUserId}
        currentEmployeeId={currentEmployeeId}
        businessId={businessId}
        onRequestsChange={setTimeOff}
      />
    </div>
  )
}
