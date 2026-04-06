'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { UserPlus } from 'lucide-react'
import EmployeeTable from '@/components/team/EmployeeTable'
import InviteModal from '@/components/team/InviteModal'
import PermissionsModal from '@/components/team/PermissionsModal'
import ActivityLog from '@/components/team/ActivityLog'
import { logActivity } from '@/lib/utils/activityLog'

interface Employee { id: string; full_name: string; email: string; role_title: string | null; user_id: string | null }
interface User { id: string; role: string; status: string; module_access: Record<string, boolean> }
interface ActivityEntry { id: string; user_id: string | null; action: string; target_type: string | null; target_id: string | null; metadata: Record<string, unknown> | null; created_at: string }

export default function TeamPage() {
  const t = useTranslations('team')
  const tc = useTranslations('common')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityEntry[]>([])
  const [businessId, setBusinessId] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [permissionsEmployee, setPermissionsEmployee] = useState<Employee | null>(null)
  const [permissionsUser, setPermissionsUser] = useState<User | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<Employee | null>(null)
  const [removeTarget, setRemoveTarget] = useState<Employee | null>(null)

  const supabase = createClient()

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    const { data: userRow } = await supabase.from('users').select('business_id').eq('id', user.id).single()
    if (!userRow?.business_id) return
    setBusinessId(userRow.business_id)

    const [empRes, logsRes] = await Promise.all([
      supabase.from('employees').select('id, full_name, email, role_title, user_id').eq('business_id', userRow.business_id),
      supabase.from('activity_logs').select('*').eq('business_id', userRow.business_id).order('created_at', { ascending: false }).limit(200),
    ])

    if (empRes.data) setEmployees(empRes.data)

    // Fetch users by ID rather than business_id — invited employees may not
    // have business_id set on their users row yet (pre-onboarding), so a
    // business_id filter would silently exclude them and status would always
    // show as "active".
    const userIds = (empRes.data ?? []).map(e => e.user_id).filter(Boolean) as string[]
    if (userIds.length > 0) {
      const { data: usersRes } = await supabase.from('users').select('id, role, status, module_access').in('id', userIds)
      if (usersRes) setUsers(usersRes)
    }
    if (logsRes.data) setActivityLogs(logsRes.data)
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  // Realtime — employees + users + activity_logs
  useEffect(() => {
    if (!businessId) return
    const channel = supabase
      .channel(`team:${businessId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees', filter: `business_id=eq.${businessId}` }, payload => {
        if (payload.eventType === 'INSERT') setEmployees(prev => [...prev, payload.new as Employee])
        if (payload.eventType === 'UPDATE') setEmployees(prev => prev.map(e => e.id === payload.new.id ? payload.new as Employee : e))
        if (payload.eventType === 'DELETE') setEmployees(prev => prev.filter(e => e.id !== payload.old.id))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, payload => {
        // No business_id filter — invited users may not have business_id set yet.
        // Only apply if the updated user is already in our local users list.
        setUsers(prev => {
          const exists = prev.some(u => u.id === payload.new.id)
          if (!exists) return prev
          return prev.map(u => u.id === payload.new.id ? payload.new as User : u)
        })
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs', filter: `business_id=eq.${businessId}` }, payload => {
        setActivityLogs(prev => [payload.new as ActivityEntry, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [businessId, supabase])

  async function handleInvite({ email, role, moduleAccess }: { email: string; role: string; moduleAccess: Record<string, boolean> }) {
    const res = await fetch('/api/team/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role, moduleAccess }),
    })
    const result = await res.json()
    if (result.employeeId) {
      await logActivity(supabase, { businessId, userId: currentUserId, action: 'employee.invited', targetType: 'employee', targetId: result.employeeId, metadata: { email, role } })
    }
  }

  async function handleSavePermissions(userId: string, role: string, moduleAccess: Record<string, boolean>) {
    await supabase.from('users').update({ role, module_access: moduleAccess }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role, module_access: moduleAccess } : u))
    await logActivity(supabase, { businessId, userId: currentUserId, action: 'permissions.updated', targetType: 'user', targetId: userId })
  }

  async function handleRemoveConfirm() {
    if (!removeTarget) return
    if (removeTarget.user_id) {
      await supabase.from('users').update({ status: 'deactivated' }).eq('id', removeTarget.user_id)
    }
    await supabase.from('employees').delete().eq('id', removeTarget.id)
    await logActivity(supabase, { businessId, userId: currentUserId, action: 'employee.removed', targetType: 'employee', targetId: removeTarget.id, metadata: { name: removeTarget.full_name } })
    setRemoveTarget(null)
    load()
  }

  async function handleDeactivateConfirm() {
    if (!deactivateTarget) return
    await supabase.from('employees').update({ role_title: deactivateTarget.role_title }).eq('id', deactivateTarget.id)
    if (deactivateTarget.user_id) {
      await supabase.from('users').update({ status: 'deactivated' }).eq('id', deactivateTarget.user_id)
    }
    await logActivity(supabase, { businessId, userId: currentUserId, action: 'employee.deactivated', targetType: 'employee', targetId: deactivateTarget.id })
    setDeactivateTarget(null)
    load()
  }

  // Users list for activity log names
  const userNames = employees.map(e => ({ id: e.user_id ?? '', full_name: e.full_name })).filter(u => u.id)

  if (loading) {
    return (
      <div style={{ padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('loadingTeam')}</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>{t('title')}</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{employees.length} {t('members').toLowerCase()}</p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', backgroundColor: 'var(--omnexia-accent)', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
        >
          <UserPlus size={15} /> {t('inviteEmployee')}
        </button>
      </div>

      {/* Employee table */}
      <EmployeeTable
        employees={employees}
        users={users}
        currentUserId={currentUserId}
        onEditPermissions={(emp, user) => { setPermissionsEmployee(emp); setPermissionsUser(user) }}
        onDeactivate={(emp) => setDeactivateTarget(emp)}
        onRemove={(emp) => setRemoveTarget(emp)}
      />

      {/* Activity log */}
      <ActivityLog logs={activityLogs} users={userNames} />

      {/* Modals */}
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvite={handleInvite} />

      <PermissionsModal
        open={permissionsEmployee !== null}
        employee={permissionsEmployee}
        user={permissionsUser}
        onClose={() => { setPermissionsEmployee(null); setPermissionsUser(null) }}
        onSave={handleSavePermissions}
      />

      {/* Remove confirm */}
      {removeTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '16px', maxWidth: '400px', width: '100%', padding: '28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>{t('removeTitle', { name: removeTarget.full_name })}</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px' }}>{t('removeDesc')}</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setRemoveTarget(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)' }}>{tc('cancel')}</button>
              <button onClick={handleRemoveConfirm} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#DC2626', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>{t('removeFromTeamConfirm')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate confirm */}
      {deactivateTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '16px', maxWidth: '400px', width: '100%', padding: '28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>{t('deactivateTitle', { name: deactivateTarget.full_name })}</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px' }}>{t('deactivateDesc')}</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeactivateTarget(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)' }}>{tc('cancel')}</button>
              <button onClick={handleDeactivateConfirm} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#DC2626', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>{t('deactivate')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
