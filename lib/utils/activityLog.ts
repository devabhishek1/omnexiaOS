import type { SupabaseClient } from '@supabase/supabase-js'

export async function logActivity(
  supabase: SupabaseClient,
  params: {
    businessId: string
    userId: string
    action: string
    targetType?: string
    targetId?: string
    metadata?: object
  }
) {
  await supabase.from('activity_logs').insert({
    business_id: params.businessId,
    user_id: params.userId,
    action: params.action,
    target_type: params.targetType ?? null,
    target_id: params.targetId ?? null,
    metadata: params.metadata ?? null,
  })
}

export function actionLabel(action: string): string {
  const map: Record<string, string> = {
    'invoice.created': 'Created invoice',
    'invoice.updated': 'Updated invoice',
    'invoice.status_changed': 'Changed invoice status',
    'expense.created': 'Added expense',
    'expense.deleted': 'Deleted expense',
    'shift.created': 'Created shift',
    'shift.updated': 'Updated shift',
    'shift.deleted': 'Deleted shift',
    'time_off.requested': 'Requested time off',
    'time_off.approved': 'Approved time-off request',
    'time_off.rejected': 'Rejected time-off request',
    'message.replied': 'Replied to message',
    'employee.invited': 'Invited employee',
    'employee.deactivated': 'Deactivated employee',
    'permissions.updated': 'Updated permissions',
  }
  return map[action] ?? action
}
