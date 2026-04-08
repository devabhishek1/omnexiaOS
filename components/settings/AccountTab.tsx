'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
]

export default function AccountTab() {
  const t = useTranslations('settings')
  const tc = useTranslations('common')
  const supabase = createClient()
  const router = useRouter()

  const [loaded, setLoaded] = useState(false)
  const [locale, setLocale] = useState('en')
  const [userId, setUserId] = useState<string | null>(null)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [savingLocale, setSavingLocale] = useState(false)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [savingPw, setSavingPw] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('users').select('locale, business_id').eq('id', user.id).single()
      if (data) {
        setLocale(data.locale ?? 'en')
        setBusinessId(data.business_id)
      }
      setLoaded(true)
    }
    load()
  }, [])

  async function handleSaveLocale() {
    if (!userId) return
    setSavingLocale(true)
    await supabase.from('users').update({ locale }).eq('id', userId)
    if (businessId) await supabase.from('businesses').update({ locale }).eq('id', businessId)
    setSavingLocale(false)
    toast.success(t('languageUpdated'))
    router.refresh()
    // Regenerate digest in the new language (fire-and-forget)
    fetch('/api/mistral/digest', { method: 'POST' })
      .then(res => res.json())
      .then(() => toast.success(t('digestRegenerated')))
      .catch(() => {/* silent — non-critical */})
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confirmPw) { toast.error(t('passwordsDoNotMatch')); return }
    if (newPw.length < 8) { toast.error(t('passwordTooShort')); return }
    setSavingPw(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setSavingPw(false)
    if (error) { toast.error(error.message); return }
    toast.success(t('passwordUpdated'))
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
  }

  async function handleDownloadData() {
    const res = await fetch('/api/account/export?type=all')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'omnexia-data-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') return
    toast.info(t('accountDeletionRequested'))
    setShowDeleteModal(false)
  }

  if (!loaded) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '560px' }}>
        {/* Language section */}
        <Skeleton style={{ width: '100%', height: 88, borderRadius: '12px' }} />
        {/* Password section */}
        <Skeleton style={{ width: '100%', height: 172, borderRadius: '12px' }} />
        {/* Billing section */}
        <Skeleton style={{ width: '100%', height: 88, borderRadius: '12px' }} />
        {/* Data & Privacy section */}
        <Skeleton style={{ width: '100%', height: 120, borderRadius: '12px' }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '560px' }}>

      {/* Language */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>{t('language')}</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>{t('interfaceLanguage')}</label>
            <select style={selectStyle} value={locale} onChange={e => setLocale(e.target.value)}>
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
              ))}
            </select>
          </div>
          <button onClick={handleSaveLocale} style={primaryBtnStyle} disabled={savingLocale}>
            {savingLocale ? tc('sending') : tc('save')}
          </button>
        </div>
      </section>

      {/* Password */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>{t('changePassword')}</h2>
        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>{t('newPassword')}</label>
            <input type="password" style={inputStyle} value={newPw} onChange={e => setNewPw(e.target.value)} minLength={8} required placeholder={t('minPasswordLength')} />
          </div>
          <div>
            <label style={labelStyle}>{t('confirmPassword')}</label>
            <input type="password" style={inputStyle} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required />
          </div>
          <div>
            <button type="submit" style={primaryBtnStyle} disabled={savingPw}>
              {savingPw ? tc('sending') : t('updatePassword')}
            </button>
          </div>
        </form>
      </section>

      {/* Billing */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>{t('billing')}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#7c3aed', background: '#ede9fe', border: '1px solid #ddd6fe', borderRadius: '4px', padding: '2px 8px' }}>Pro</span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('currentPlan')}</span>
        </div>
        <div style={{ marginTop: '10px', position: 'relative', display: 'inline-block' }}>
          <button
            style={{ ...secondaryBtnStyle, opacity: 0.5, cursor: 'not-allowed' }}
            disabled
            title="Coming soon"
          >
            {t('manageSubscription')}
          </button>
          <span style={{ position: 'absolute', top: -8, right: -8, fontSize: '9px', fontWeight: 600, color: '#b45309', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '4px', padding: '1px 5px' }}>Soon</span>
        </div>
      </section>

      {/* Data & Privacy */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>{t('dataPrivacy')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <button onClick={handleDownloadData} style={secondaryBtnStyle}>{t('downloadData')}</button>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t('exportDataHint')}
            </p>
          </div>
          <div>
            <button onClick={() => setShowDeleteModal(true)} style={dangerBtnStyle}>{t('deleteAccount')}</button>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t('deleteGracePeriod')}
            </p>
          </div>
        </div>
      </section>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{t('deleteAccountTitle')}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {t('deleteAccountModalDesc')}
            </p>
            <input
              style={{ ...inputStyle, marginBottom: '14px' }}
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder={t('typeDeletePlaceholder')}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteModal(false)} style={secondaryBtnStyle}>{tc('cancel')}</button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE'}
                style={{ ...dangerBtnStyle, opacity: deleteConfirm !== 'DELETE' ? 0.5 : 1, cursor: deleteConfirm !== 'DELETE' ? 'not-allowed' : 'pointer' }}
              >
                {t('deleteAccount')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const sectionStyle: React.CSSProperties = { border: '1px solid var(--border-default)', borderRadius: '12px', padding: '16px 20px', background: 'var(--bg-surface)' }
const sectionTitleStyle: React.CSSProperties = { fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }
const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', boxSizing: 'border-box' }
const selectStyle: React.CSSProperties = { width: '100%', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }
const primaryBtnStyle: React.CSSProperties = { background: 'var(--omnexia-accent)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', whiteSpace: 'nowrap' }
const secondaryBtnStyle: React.CSSProperties = { background: 'var(--bg-muted)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }
const dangerBtnStyle: React.CSSProperties = { background: 'transparent', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }
const modalStyle: React.CSSProperties = { background: 'var(--bg-surface)', borderRadius: '12px', padding: '24px', width: '420px', maxWidth: '90vw', border: '1px solid var(--border-default)' }
