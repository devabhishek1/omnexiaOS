'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

const MODULES = ['communications', 'finance', 'planning', 'team'] as const

interface Employee { id: string; full_name: string }
interface User { id: string; role: string; status: string; module_access: Record<string, boolean> }

interface Props {
  open: boolean
  employee: Employee | null
  user: User | null
  onClose: () => void
  onSave: (userId: string, role: string, moduleAccess: Record<string, boolean>) => Promise<void>
}

export default function PermissionsModal({ open, employee, user, onClose, onSave }: Props) {
  const [role, setRole] = useState(user?.role ?? 'employee')
  const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>(
    user?.module_access ?? { communications: true, finance: false, planning: true, team: false }
  )
  const [saving, setSaving] = useState(false)

  if (!open || !employee) return null

  // Sync state when user prop changes
  const currentRole = user?.role ?? 'employee'
  const currentAccess = user?.module_access ?? { communications: true, finance: false, planning: true, team: false }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    await onSave(user.id, role, moduleAccess)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '16px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Edit Permissions</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{employee.full_name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><X size={18} color="var(--text-muted)" /></button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} style={inputStyle}>
              {['admin', 'manager', 'employee', 'accountant'].map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ ...labelStyle, marginBottom: '10px' }}>Module access</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !user} style={{ padding: '8px 20px', borderRadius: '8px', backgroundColor: saving ? 'var(--border-strong)' : 'var(--omnexia-accent)', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', boxSizing: 'border-box' }
