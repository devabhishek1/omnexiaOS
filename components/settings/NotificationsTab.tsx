'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

type NotifPrefs = {
  digest_enabled: boolean
  digest_time: string
  digest_email: boolean
  digest_in_app: boolean
  overdue_enabled: boolean
  overdue_days: number
  messages_enabled: boolean
  pennylane_sync_enabled: boolean
}

const DEFAULTS: NotifPrefs = {
  digest_enabled: true,
  digest_time: '07:00',
  digest_email: true,
  digest_in_app: true,
  overdue_enabled: true,
  overdue_days: 3,
  messages_enabled: true,
  pennylane_sync_enabled: true,
}

export default function NotificationsTab() {
  const supabase = createClient()
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULTS)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('users').select('notification_preferences').eq('id', user.id).single()
      if (data?.notification_preferences) {
        setPrefs({ ...DEFAULTS, ...(data.notification_preferences as Partial<NotifPrefs>) })
      }
      setLoading(false)
    }
    load()
  }, [])

  function set<K extends keyof NotifPrefs>(key: K, value: NotifPrefs[K]) {
    setPrefs(p => ({ ...p, [key]: value }))
  }

  async function handleSave() {
    if (!userId) return
    setSaving(true)
    const { error } = await supabase.from('users').update({ notification_preferences: prefs }).eq('id', userId)
    setSaving(false)
    if (error) { toast.error('Failed to save preferences'); return }
    toast.success('Preferences saved')
  }

  if (loading) return <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '20px 0' }}>Loading…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '560px' }}>

      {/* Daily AI Digest */}
      <NotifSection title="Daily AI Digest" description="Morning summary of your business — emails, invoices, shifts.">
        <Row label="Enable daily digest">
          <Switch checked={prefs.digest_enabled} onCheckedChange={v => set('digest_enabled', v)} />
        </Row>
        {prefs.digest_enabled && (
          <>
            <Row label="Delivery time">
              <input
                type="time"
                value={prefs.digest_time}
                onChange={e => set('digest_time', e.target.value)}
                style={inputStyle}
              />
            </Row>
            <Row label="Send by email">
              <Switch checked={prefs.digest_email} onCheckedChange={v => set('digest_email', v)} />
            </Row>
            <Row label="Show in-app">
              <Switch checked={prefs.digest_in_app} onCheckedChange={v => set('digest_in_app', v)} />
            </Row>
          </>
        )}
      </NotifSection>

      {/* Invoice Overdue Alerts */}
      <NotifSection title="Invoice Overdue Alerts" description="Get notified when invoices become overdue.">
        <Row label="Enable overdue alerts">
          <Switch checked={prefs.overdue_enabled} onCheckedChange={v => set('overdue_enabled', v)} />
        </Row>
        {prefs.overdue_enabled && (
          <Row label="Trigger after (days overdue)">
            <input
              type="number"
              min={1}
              max={90}
              value={prefs.overdue_days}
              onChange={e => set('overdue_days', parseInt(e.target.value) || 3)}
              style={{ ...inputStyle, width: 80 }}
            />
          </Row>
        )}
      </NotifSection>

      {/* New Message Alerts */}
      <NotifSection title="New Message Alerts" description="In-app notification when a new email or message arrives.">
        <Row label="Enable message alerts">
          <Switch checked={prefs.messages_enabled} onCheckedChange={v => set('messages_enabled', v)} />
        </Row>
      </NotifSection>

      {/* Pennylane Sync Alerts */}
      <NotifSection title="Pennylane Sync Alerts" description="Notify when sync fails or finds new overdue invoices.">
        <Row label="Enable sync alerts">
          <Switch checked={prefs.pennylane_sync_enabled} onCheckedChange={v => set('pennylane_sync_enabled', v)} />
        </Row>
      </NotifSection>

      <div>
        <button onClick={handleSave} style={primaryBtnStyle} disabled={saving}>
          {saving ? 'Saving…' : 'Save preferences'}
        </button>
      </div>
    </div>
  )
}

function NotifSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid var(--border-default)', borderRadius: '12px', padding: '16px 20px', background: 'var(--bg-surface)' }}>
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{description}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = { border: '1px solid var(--border-default)', borderRadius: '6px', padding: '5px 10px', fontSize: '13px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }
const primaryBtnStyle: React.CSSProperties = { background: 'var(--omnexia-accent)', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }
