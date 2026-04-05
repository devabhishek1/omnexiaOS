'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'

const MODULES = ['communications', 'finance', 'planning', 'team'] as const
type Module = typeof MODULES[number]

interface Props {
  open: boolean
  onClose: () => void
  onInvite: (data: { email: string; role: string; moduleAccess: Record<string, boolean> }) => Promise<void>
}

const DEFAULT_ACCESS: Record<string, boolean> = { communications: true, finance: false, planning: true, team: false }
const ROLE_DEFAULTS: Record<string, Record<string, boolean>> = {
  admin: { communications: true, finance: true, planning: true, team: true },
  manager: { communications: true, finance: true, planning: true, team: false },
  employee: { communications: false, finance: false, planning: true, team: false },
  accountant: { communications: false, finance: true, planning: false, team: false },
}

export default function InviteModal({ open, onClose, onInvite }: Props) {
  const t = useTranslations('team')
  const tc = useTranslations('common')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('employee')
  const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>(DEFAULT_ACCESS)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  function handleRoleChange(r: string) {
    setRole(r)
    setModuleAccess(ROLE_DEFAULTS[r] ?? DEFAULT_ACCESS)
  }

  async function handleSend() {
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email address.'); return }
    setError(''); setSending(true)
    try {
      await onInvite({ email: email.trim(), role, moduleAccess })
      setEmail(''); setRole('employee'); setModuleAccess(DEFAULT_ACCESS)
      onClose()
    } catch (e) {
      setError('Failed to send invite. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '16px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('invite')}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><X size={18} color="var(--text-muted)" /></button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>{t('inviteEmail')}</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="colleague@company.com" type="email" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>{t('role')}</label>
            <select value={role} onChange={e => handleRoleChange(e.target.value)} style={inputStyle}>
              {['admin', 'manager', 'employee', 'accountant'].map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ ...labelStyle, marginBottom: '8px' }}>{t('moduleAccess')}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {MODULES.map(mod => (
                <label key={mod} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{mod}</span>
                  <div
                    onClick={() => setModuleAccess(prev => ({ ...prev, [mod]: !prev[mod] }))}
                    style={{
                      width: '36px', height: '20px', borderRadius: '20px',
                      backgroundColor: moduleAccess[mod] ? 'var(--omnexia-accent)' : 'var(--border-strong)',
                      position: 'relative', cursor: 'pointer', transition: 'background-color 0.15s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: '2px',
                      left: moduleAccess[mod] ? '18px' : '2px',
                      width: '16px', height: '16px', borderRadius: '50%',
                      backgroundColor: '#fff', transition: 'left 0.15s',
                    }} />
                  </div>
                </label>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            An invitation email will be sent to this address via Resend.
          </p>

          {error && <p style={{ fontSize: '13px', color: '#DC2626', margin: 0 }}>{error}</p>}
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)' }}>{tc('cancel')}</button>
          <button onClick={handleSend} disabled={sending} style={{ padding: '8px 20px', borderRadius: '8px', backgroundColor: sending ? 'var(--border-strong)' : 'var(--omnexia-accent)', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer' }}>
            {sending ? t('inviteSending') : t('inviteSend')}
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', boxSizing: 'border-box' }
