'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, X } from 'lucide-react'

interface Employee { id: string; full_name: string }
interface TimeOffRequest {
  id: string
  employee_id: string
  start_date: string
  end_date: string
  reason: string | null
  status: string
  created_at: string
}

interface Props {
  requests: TimeOffRequest[]
  employees: Employee[]
  currentUserId: string
  currentEmployeeId: string | null
  currentUserRole: string
  businessId: string
  onRequestsChange: (r: TimeOffRequest[]) => void
}

export default function TimeOffPanel({ requests, employees, currentUserId, currentEmployeeId, currentUserRole, businessId, onRequestsChange }: Props) {
  const t = useTranslations('planning')
  const tc = useTranslations('common')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'manager'
  const pending = requests.filter(r => r.status === 'pending')
  const myRequests = currentEmployeeId ? requests.filter(r => r.employee_id === currentEmployeeId) : []
  const visibleRequests = isAdmin ? requests : myRequests

  function getEmployeeName(id: string): string {
    return employees.find(e => e.id === id)?.full_name ?? 'Unknown'
  }

  async function handleSubmit() {
    if (!startDate || !endDate || !currentEmployeeId) { setError('Please fill in all fields.'); return }
    if (endDate < startDate) { setError('End date must be after start date.'); return }
    setError(''); setSubmitting(true)
    const res = await fetch('/api/planning/time-off', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, employeeId: currentEmployeeId, startDate, endDate, reason }),
    })
    const result = await res.json()
    if (result.data) {
      onRequestsChange([...requests, result.data as TimeOffRequest])
      setStartDate(''); setEndDate(''); setReason('')
    } else {
      setError(result.error ?? 'Failed to submit request.')
    }
    setSubmitting(false)
  }

  async function handleReview(id: string, status: 'approved' | 'rejected') {
    const res = await fetch('/api/planning/time-off', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: id, status }),
    })
    const result = await res.json()
    if (result.data) {
      onRequestsChange(requests.map(r => r.id === id ? result.data as TimeOffRequest : r))
    }
  }

  const statusColors: Record<string, { bg: string; color: string }> = {
    pending: { bg: '#FEF3C7', color: '#D97706' },
    approved: { bg: '#DCFCE7', color: '#16A34A' },
    rejected: { bg: '#FEE2E2', color: '#DC2626' },
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {/* Admin: Pending requests */}
      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '20px 24px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px' }}>
          {t('timeOffRequests')}
          {isAdmin && pending.length > 0 && <span style={{ marginLeft: '8px', backgroundColor: '#EF4444', color: '#fff', borderRadius: '20px', padding: '1px 7px', fontSize: '11px' }}>{pending.length}</span>}
        </p>

        {visibleRequests.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>{t('noRequests')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {visibleRequests.slice().sort((a, b) => a.status === 'pending' ? -1 : 1).map(req => {
              const sc = statusColors[req.status] ?? statusColors.pending
              return (
                <div key={req.id} style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      {isAdmin && <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{getEmployeeName(req.employee_id)}</p>}
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: isAdmin ? '2px 0 0' : 0 }}>
                        {new Date(req.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        {' – '}
                        {new Date(req.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {req.reason && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>{req.reason}</p>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', backgroundColor: sc.bg, color: sc.color, textTransform: 'capitalize' }}>{req.status}</span>
                      {isAdmin && req.status === 'pending' && (
                        <>
                          <button onClick={() => handleReview(req.id, 'approved')} style={{ background: '#DCFCE7', border: 'none', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <Check size={12} color="#16A34A" />
                          </button>
                          <button onClick={() => handleReview(req.id, 'rejected')} style={{ background: '#FEE2E2', border: 'none', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <X size={12} color="#DC2626" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Employee: Request leave */}
      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '20px 24px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px' }}>{t('requestTimeOff')}</p>

        {!currentEmployeeId ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('noEmployeeProfile')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>{t('startDate')}</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{t('endDate')}</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>{t('reason')}</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Annual leave, medical, etc." style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            {error && <p style={{ fontSize: '12px', color: '#DC2626', margin: 0 }}>{error}</p>}
            <button onClick={handleSubmit} disabled={submitting} style={{ padding: '8px 16px', backgroundColor: submitting ? 'var(--border-strong)' : 'var(--omnexia-accent)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              {submitting ? tc('sending') : t('requestTimeOff')}
            </button>

            {/* Own history — only shown to admins/managers since employees see their requests in the left panel */}
            {isAdmin && myRequests.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 8px' }}>{t('myRequests')}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {myRequests.map(r => {
                    const sc = statusColors[r.status] ?? statusColors.pending
                    return (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span>
                          {new Date(r.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          {' – '}
                          {new Date(r.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '1px 7px', borderRadius: '20px', backgroundColor: sc.bg, color: sc.color, textTransform: 'capitalize' }}>{r.status}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '3px' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', boxSizing: 'border-box' }
