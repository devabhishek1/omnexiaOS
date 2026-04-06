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
  status: string
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
  onRemove: (employee: Employee) => void
}

const roleColors: Record<string, { bg: string; color: string }> = {
  admin: { bg: '#DBEAFE', color: '#1D4ED8' },
  manager: { bg: '#EDE9FE', color: '#7C3AED' },
  employee: { bg: '#DCFCE7', color: '#15803D' },
  accountant: { bg: '#FEF3C7', color: '#B45309' },
}

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  invited:     { bg: '#DBEAFE', color: '#1D4ED8', label: 'Invited' },
  active:      { bg: '#DCFCE7', color: '#15803D', label: 'Active' },
  on_leave:    { bg: '#FEF3C7', color: '#B45309', label: 'On Leave' },
  deactivated: { bg: '#FEE2E2', color: '#DC2626', label: 'Inactive' },
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function EmployeeTable({ employees, users, currentUserId, onEditPermissions, onDeactivate, onRemove }: Props) {
  const t = useTranslations('team')
  const tc = useTranslations('common')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)

  function getUserForEmployee(emp: Employee): User | null {
    return users.find(u => u.id === emp.user_id) ?? null
  }

  function closeMenu() {
    setOpenMenuId(null)
    setMenuPos(null)
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
            const role = user?.role ?? (emp.role_title ?? 'employee')
            // Status comes from employees.status — single source of truth
            const status = emp.status ?? 'invited'
            const rc = roleColors[role] ?? roleColors.employee
            const sc = statusColors[status] ?? statusColors.active
            const isMe = emp.user_id === currentUserId
            const isInvited = status === 'invited'
            const isDeactivated = status === 'deactivated'

            return (
              <tr
                key={emp.id}
                style={{
                  borderBottom: i < employees.length - 1 ? '1px solid var(--border)' : 'none',
                  opacity: isDeactivated ? 0.55 : 1,
                }}
              >
                {/* Name + email */}
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: isInvited ? '#DBEAFE' : 'var(--omnexia-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: isInvited ? '#1D4ED8' : 'var(--omnexia-accent)', flexShrink: 0 }}>
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

                {/* Access level / permissions badge */}
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px', backgroundColor: rc.bg, color: rc.color, textTransform: 'capitalize' }}>
                    {role}
                  </span>
                </td>

                {/* Status — read from employees.status */}
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px', backgroundColor: sc.bg, color: sc.color }}>
                    {t(`status_${status}`) ?? sc.label}
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
                      onClick={(e) => {
                        if (openMenuId === emp.id) {
                          closeMenu()
                        } else {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
                          setOpenMenuId(emp.id)
                        }
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                    >
                      <MoreHorizontal size={15} color="var(--text-muted)" />
                    </button>

                    {openMenuId === emp.id && menuPos && (
                      <>
                        <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={closeMenu} />
                        <div style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '160px' }}>
                          {!isInvited && (
                            <button
                              onClick={() => { onEditPermissions(emp, user); closeMenu() }}
                              style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                            >
                              {t('editPermissions')}
                            </button>
                          )}
                          {!isDeactivated && !isInvited && (
                            <button
                              onClick={() => { onDeactivate(emp); closeMenu() }}
                              style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: '13px', cursor: 'pointer', color: '#DC2626' }}
                            >
                              {t('deactivate')}
                            </button>
                          )}
                          {!isMe && (
                            <button
                              onClick={() => { onRemove(emp); closeMenu() }}
                              style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: '13px', cursor: 'pointer', color: '#DC2626', borderTop: (!isInvited && !isDeactivated) ? '1px solid var(--border)' : 'none' }}
                            >
                              {t('removeFromTeam')}
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
