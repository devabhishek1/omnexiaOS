'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { startOfWeek, endOfWeek, format } from 'date-fns'
import { ArrowLeft, Mail, Phone } from 'lucide-react'
import { actionLabel } from '@/lib/utils/activityLog'

const MODULES = ['communications', 'finance', 'planning', 'team'] as const

interface Employee { id: string; full_name: string; email: string; phone: string | null; role_title: string | null; user_id: string | null }
interface User { id: string; role: string; status: string; module_access: Record<string, boolean> }
interface Shift { id: string; date: string; start_time: string; end_time: string; notes: string | null }
interface ActivityEntry { id: string; action: string; target_type: string | null; created_at: string }

const roleColors: Record<string, { bg: string; color: string }> = {
  admin: { bg: '#DBEAFE', color: '#1D4ED8' },
  manager: { bg: '#EDE9FE', color: '#7C3AED' },
  employee: { bg: '#DCFCE7', color: '#15803D' },
  accountant: { bg: '#FEF3C7', color: '#B45309' },
}
const statusColors: Record<string, { bg: string; color: string }> = {
  active: { bg: '#DCFCE7', color: '#15803D' },
  on_leave: { bg: '#FEF3C7', color: '#B45309' },
  deactivated: { bg: '#F3F4F6', color: '#6B7280' },
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function EmployeeProfilePage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('team')
  const tc = useTranslations('common')
  const tp = useTranslations('planning')
  const employeeId = params.employeeId as string

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [logs, setLogs] = useState<ActivityEntry[]>([])
  const [editing, setEditing] = useState(false)
  const [phone, setPhone] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: emp } = await supabase.from('employees').select('*').eq('id', employeeId).single()
      if (!emp) { router.push('/team'); return }
      setEmployee(emp)
      setPhone(emp.phone ?? '')
      setRoleTitle(emp.role_title ?? '')

      const [userRes, shiftRes, logRes] = await Promise.all([
        emp.user_id ? supabase.from('users').select('id, role, status, module_access').eq('id', emp.user_id).single() : Promise.resolve({ data: null }),
        supabase.from('shifts').select('id, date, start_time, end_time, notes')
          .eq('employee_id', employeeId)
          .gte('date', format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'))
          .lte('date', format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')),
        emp.user_id ? supabase.from('activity_logs').select('id, action, target_type, created_at').eq('user_id', emp.user_id).order('created_at', { ascending: false }).limit(20) : Promise.resolve({ data: [] }),
      ])

      if (userRes.data) setUser(userRes.data)
      if (shiftRes.data) setShifts(shiftRes.data)
      if (logRes.data) setLogs(logRes.data)
      setLoading(false)
    }
    load()
  }, [employeeId, supabase, router])

  async function handleSave() {
    if (!employee) return
    setSaving(true)
    await supabase.from('employees').update({ phone: phone || null, role_title: roleTitle || null }).eq('id', employee.id)
    setEmployee(prev => prev ? { ...prev, phone: phone || null, role_title: roleTitle || null } : prev)
    setEditing(false)
    setSaving(false)
  }

  async function handleToggleModule(mod: string) {
    if (!user) return
    const updated = { ...user.module_access, [mod]: !user.module_access[mod] }
    await supabase.from('users').update({ module_access: updated }).eq('id', user.id)
    setUser(prev => prev ? { ...prev, module_access: updated } : prev)
  }

  if (loading || !employee) {
    return (
      <div style={{ padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('loadingProfile')}</p>
      </div>
    )
  }

  const role = user?.role ?? 'employee'
  const status = user?.status ?? 'active'
  const rc = roleColors[role] ?? roleColors.employee
  const sc = statusColors[status] ?? statusColors.active
  const DAYS = [tp('monday'), tp('tuesday'), tp('wednesday'), tp('thursday'), tp('friday'), tp('saturday'), tp('sunday')]
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekDays = DAYS.map((_, i) => format(new Date(weekStart.getTime() + i * 86400000), 'yyyy-MM-dd'))

  return (
    <div style={{ padding: '24px 32px', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Back */}
      <button onClick={() => router.push('/team')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)', padding: 0, width: 'fit-content' }}>
        <ArrowLeft size={14} /> {t('backToTeam')}
      </button>

      {/* Header card */}
      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--omnexia-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, color: 'var(--omnexia-accent)', flexShrink: 0 }}>
              {initials(employee.full_name)}
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{employee.full_name}</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 8px' }}>{employee.role_title ?? t('noTitleSet')}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px', backgroundColor: rc.bg, color: rc.color }}>{t(role as 'admin' | 'manager' | 'employee' | 'accountant')}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px', backgroundColor: sc.bg, color: sc.color }}>{t(`status_${status}` as 'status_active' | 'status_on_leave' | 'status_deactivated' | 'status_invited')}</span>
              </div>
            </div>
          </div>
          <button onClick={() => setEditing(e => !e)} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            {editing ? tc('cancel') : tc('edit')}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Contact info */}
        <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '20px' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px' }}>{t('contact')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={14} color="var(--text-muted)" />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{employee.email}</span>
            </div>
            {editing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} color="var(--text-muted)" />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78" style={{ flex: 1, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', backgroundColor: 'var(--bg-elevated)' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} color="var(--text-muted)" />
                <span style={{ fontSize: '13px', color: employee.phone ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{employee.phone ?? t('noPhoneSet')}</span>
              </div>
            )}
            {editing && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('roleTitle')}</label>
                <input value={roleTitle} onChange={e => setRoleTitle(e.target.value)} placeholder="e.g. Sales Manager" style={{ padding: '5px 8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', backgroundColor: 'var(--bg-elevated)' }} />
              </div>
            )}
            {editing && (
              <button onClick={handleSave} disabled={saving} style={{ padding: '7px 14px', borderRadius: '7px', backgroundColor: 'var(--omnexia-accent)', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
                {saving ? tc('sending') : tc('save')}
              </button>
            )}
          </div>
        </div>

        {/* Module access */}
        <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '20px' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px' }}>{t('moduleAccess')}</p>
          {!user ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('noAccountLinked')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {MODULES.map(mod => (
                <label key={mod} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{mod}</span>
                  <div onClick={() => handleToggleModule(mod)} style={{ width: '36px', height: '20px', borderRadius: '20px', backgroundColor: user.module_access?.[mod] ? 'var(--omnexia-accent)' : 'var(--border-strong)', position: 'relative', cursor: 'pointer', transition: 'background-color 0.15s' }}>
                    <div style={{ position: 'absolute', top: '2px', left: user.module_access?.[mod] ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.15s' }} />
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* This week's schedule */}
      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '20px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>{t('thisWeeksSchedule')}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {DAYS.map((day, i) => {
            const shift = shifts.find(s => s.date === weekDays[i])
            return (
              <div key={day} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px' }}>{day}</p>
                {shift ? (
                  <div style={{ backgroundColor: 'var(--omnexia-accent)', borderRadius: '6px', padding: '6px 4px' }}>
                    <p style={{ fontSize: '11px', color: '#fff', fontWeight: 600, margin: 0 }}>{shift.start_time.slice(0, 5)}</p>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)', margin: '1px 0 0' }}>{shift.end_time.slice(0, 5)}</p>
                  </div>
                ) : (
                  <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: '6px', padding: '6px 4px' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{t('off')}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Activity history */}
      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>{t('activityHistory')}</p>
        {logs.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>{t('noActivityRecorded')}</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id} style={{ borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '10px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>{actionLabel(log.action)}</td>
                  <td style={{ padding: '10px 20px', fontSize: '12px', color: 'var(--text-muted)' }}>{log.target_type ?? '—'}</td>
                  <td style={{ padding: '10px 20px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
