import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getResend } from '@/lib/resend/client'
import { timeOffResponseTemplate } from '@/lib/resend/templates/time-off-response'
import { timeOffRequestTemplate } from '@/lib/resend/templates/time-off-request'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { businessId, employeeId, startDate, endDate, reason } = await request.json()
  if (!businessId || !employeeId || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: inserted, error } = await admin
    .from('time_off_requests')
    .insert({ business_id: businessId, employee_id: employeeId, start_date: startDate, end_date: endDate, reason: reason || null, status: 'pending' })
    .select()
    .single()

  if (error || !inserted) {
    return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })
  }

  // Email the admin/owner of the business
  try {
    const { data: emp } = await admin.from('employees').select('full_name').eq('id', employeeId).single()
    const { data: biz } = await admin.from('businesses').select('name, locale').eq('id', businessId).single()
    const { data: admins } = await admin
      .from('users')
      .select('email')
      .eq('business_id', businessId)
      .in('role', ['admin', 'manager'])

    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/planning`
    const resend = getResend()
    const locale = biz?.locale ?? 'en'
    const { getEmailStrings } = await import('@/lib/resend/email-i18n')
    const s = getEmailStrings(locale)
    const empName = emp?.full_name ?? 'An employee'
    const bizName = biz?.name ?? 'your company'

    for (const adminUser of admins ?? []) {
      if (!adminUser.email) continue
      await resend.emails.send({
        from: 'Omnexia <notifications@omnexia.eu>',
        to: adminUser.email,
        subject: s.timeOffRequestSubject(empName),
        html: timeOffRequestTemplate({
          employeeName: empName,
          startDate,
          endDate,
          reason: reason || null,
          businessName: bizName,
          dashboardUrl,
          locale,
        }),
      })
    }
  } catch (e) {
    console.error('[planning/time-off POST] Resend error:', e)
  }

  return NextResponse.json({ ok: true, data: inserted })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { requestId, status } = await request.json()
  if (!requestId || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  // Only admins and managers may approve/reject
  const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!userRow || !['admin', 'manager'].includes(userRow.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Update the request
  const { data: updated, error } = await admin
    .from('time_off_requests')
    .update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', requestId)
    .select('*, employees(id, full_name, email, user_id, business_id)')
    .single()

  if (error || !updated) {
    return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: 500 })
  }

  const emp = updated.employees as unknown as {
    id: string; full_name: string; email: string | null; user_id: string | null; business_id: string
  } | null

  if (emp) {
    // Get business name
    const { data: biz } = await admin.from('businesses').select('name, locale').eq('id', emp.business_id).single()
    const businessName = biz?.name ?? 'your company'
    const locale = biz?.locale ?? 'en'

    // Send email to employee if they have an email
    if (emp.email) {
      try {
        const resend = getResend()
        const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/planning`
        const { getEmailStrings } = await import('@/lib/resend/email-i18n')
        const s = getEmailStrings(locale)
        const approved = status === 'approved'
        await resend.emails.send({
          from: 'Omnexia <notifications@omnexia.eu>',
          to: emp.email,
          subject: s.timeOffResponseSubject(approved),
          html: timeOffResponseTemplate({
            employeeName: emp.full_name,
            status: status as 'approved' | 'rejected',
            startDate: updated.start_date,
            endDate: updated.end_date,
            businessName,
            dashboardUrl,
            locale,
          }),
        })
      } catch (e) {
        console.error('[planning/time-off] Resend error:', e)
      }
    }

    // Insert in-app notification for the employee (if they have a user account)
    if (emp.user_id) {
      await admin.from('notifications').insert({
        business_id: emp.business_id,
        user_id: emp.user_id,
        type: 'time_off',
        title: `Time-off request ${status}`,
        body: `${updated.start_date} → ${updated.end_date}`,
        link: '/planning',
        is_read: false,
      })
    }
  }

  return NextResponse.json({ ok: true, data: updated })
}
