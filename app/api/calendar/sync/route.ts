/**
 * POST /api/calendar/sync
 * Syncs all shifts and approved time-off for the business to Google Calendar.
 * Uses the Google Calendar event ID stored on each record to update instead of duplicate.
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createOrUpdateCalendarEvent } from '@/lib/google-calendar/client'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Resolve business
  const { data: userRow } = await admin
    .from('users')
    .select('business_id')
    .eq('id', user.id)
    .single()
  if (!userRow?.business_id) {
    return NextResponse.json({ error: 'No business found' }, { status: 400 })
  }
  const businessId = userRow.business_id

  // Check Gmail token exists (we reuse it for Calendar)
  const { data: tokenRow } = await admin
    .from('gmail_tokens')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!tokenRow) {
    return NextResponse.json(
      { error: 'Google account not connected. Connect Gmail first to enable calendar sync.' },
      { status: 400 }
    )
  }

  // Fetch shifts with employee names
  const { data: shifts } = await admin
    .from('shifts')
    .select('id, date, start_time, end_time, notes, calendar_event_id, employees(full_name)')
    .eq('business_id', businessId)

  // Fetch approved time-off with employee names
  const { data: timeOff } = await admin
    .from('time_off_requests')
    .select('id, start_date, end_date, reason, calendar_event_id, employees(full_name)')
    .eq('business_id', businessId)
    .eq('status', 'approved')

  let synced = 0
  let failed = 0

  // Sync shifts
  for (const shift of shifts ?? []) {
    const employeeName =
      (Array.isArray(shift.employees) ? shift.employees[0]?.full_name : (shift.employees as { full_name: string } | null)?.full_name) ?? 'Employee'

    const eventId = await createOrUpdateCalendarEvent(
      {
        summary: `Shift: ${employeeName}`,
        description: shift.notes ?? '',
        start: { dateTime: `${shift.date}T${shift.start_time}`, timeZone: 'UTC' },
        end: { dateTime: `${shift.date}T${shift.end_time}`, timeZone: 'UTC' },
        colorId: '1',
      },
      user.id,
      shift.calendar_event_id
    )

    if (eventId) {
      if (eventId !== shift.calendar_event_id) {
        await admin.from('shifts').update({ calendar_event_id: eventId }).eq('id', shift.id)
      }
      synced++
    } else {
      failed++
    }
  }

  // Sync approved time-off
  for (const request of timeOff ?? []) {
    const employeeName =
      (Array.isArray(request.employees) ? request.employees[0]?.full_name : (request.employees as { full_name: string } | null)?.full_name) ?? 'Employee'

    // Google Calendar all-day end date is exclusive — add 1 day
    const endDate = new Date(request.end_date)
    endDate.setDate(endDate.getDate() + 1)
    const endDateStr = endDate.toISOString().split('T')[0]

    const eventId = await createOrUpdateCalendarEvent(
      {
        summary: `Time Off: ${employeeName}`,
        description: request.reason ?? '',
        start: { date: request.start_date },
        end: { date: endDateStr },
        colorId: '2',
      },
      user.id,
      request.calendar_event_id
    )

    if (eventId) {
      if (eventId !== request.calendar_event_id) {
        await admin
          .from('time_off_requests')
          .update({ calendar_event_id: eventId })
          .eq('id', request.id)
      }
      synced++
    } else {
      failed++
    }
  }

  if (synced === 0 && failed > 0) {
    return NextResponse.json(
      { error: 'Calendar sync failed. You may need to reconnect Google with calendar write permissions.' },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true, synced, failed })
}
