'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { MoreHorizontal, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Employee {
  id: string
  full_name: string
  email: string
  role_title: string | null
  user_id: string | null
}

interface User {
  id: string
  role: string
  status: string
  module_access: Record<string, boolean>
}

interface Props {
  employees: Employee[]
  users: User[]
  currentUserId: string
  onEditPermissions: (employee: Employee, user: User | null) => void
  onDeactivate: (employee: Employee) => void
}

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

export default function EmployeeTable({ employees, users, currentUserId, onEditPermissions, onDeactivate }: Props) {
  const t = useTranslations('team')
  const tc = useTranslations('common')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  function getUserForEmployee(emp: Employee): User | null {
    return users.find(u => u.id === emp.user_id) ?? null
  }

  if (employees.length === 0) {
    return (
      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '48px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{t('noMembers')}</p>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {[t('members'), t('role'), t('permissions'), tc('status'), tc('actions')].map(h => (
              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp, i) => {
            const user = getUserForEmployee(emp)
            const role = user?.role ?? 'employee'
            const status = user?.status ?? 'active'
            const rc = roleColors[role] ?? roleColors.employee
            const sc = statusColors[status] ?? statusColors.active
            const isMe = emp.user_id === currentUserId

            return (
              <tr
                key={emp.id}
                style={{
                  borderBottom: i < employees.length - 1 ? '1px solid var(--border)' : 'none',
                  opacity: status === 'deactivated' ? 0.5 : 1,
                }}
              >
                {/* Name + email */}
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--omnexia-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'var(--omnexia-accent)', flexShrink: 0 }}>
                      {initials(emp.full_name)}
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                        {emp.full_name}
                        {isMe && <span style={{ fontSize: '10px', marginLeft: '6px', color: 'var(--text-muted)' }}>(you)</span>}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '1px 0 0' }}>{emp.email}</p>
                    </div>
                  </div>
                </td>

                {/* Role title */}
                <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {emp.role_title ?? '—'}
                </td>

                {/* Access level */}
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px', backgroundColor: rc.bg, color: rc.color, textTransform: 'capitalize' }}>
                    {role}
                  </span>
                </td>

                {/* Status */}
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px', backgroundColor: sc.bg, color: sc.color, textTransform: 'capitalize' }}>
                    {status === 'on_leave' ? 'On Leave' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </td>

                {/* Actions */}
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                    <Link
                      href={`/team/${emp.id}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--omnexia-accent)', textDecoration: 'none', fontWeight: 500 }}
                    >
                      {t('viewProfile')} <ChevronRight size={12} />
                    </Link>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === emp.id ? null : emp.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                    >
                      <MoreHorizontal size={15} color="var(--text-muted)" />
                    </button>

                    {openMenuId === emp.id && (
                      <>
                        <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpenMenuId(null)} />
                        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '160px' }}>
                          <button
                            onClick={() => { onEditPermissions(emp, user); setOpenMenuId(null) }}
                            style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                          >
                            {t('editPermissions')}
                          </button>
                          {status !== 'deactivated' && (
                            <button
                              onClick={() => { onDeactivate(emp); setOpenMenuId(null) }}
                              style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: '13px', cursor: 'pointer', color: '#DC2626' }}
                            >
                              {t('deactivate')}
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
