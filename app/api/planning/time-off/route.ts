import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getResend } from '@/lib/resend/client'
import { timeOffResponseTemplate } from '@/lib/resend/templates/time-off-response'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { requestId, status } = await request.json()
  if (!requestId || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
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
    const { data: biz } = await admin.from('businesses').select('name').eq('id', emp.business_id).single()
    const businessName = biz?.name ?? 'your company'

    // Send email to employee if they have an email
    if (emp.email) {
      try {
        const resend = getResend()
        const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/planning`
        await resend.emails.send({
          from: 'Omnexia <notifications@omnexia.eu>',
          to: emp.email,
          subject: `Your time-off request has been ${status}`,
          html: timeOffResponseTemplate({
            employeeName: emp.full_name,
            status: status as 'approved' | 'rejected',
            startDate: updated.start_date,
            endDate: updated.end_date,
            businessName,
            dashboardUrl,
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
