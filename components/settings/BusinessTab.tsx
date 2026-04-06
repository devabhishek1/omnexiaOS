'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { EU_VAT_RATES } from '@/lib/utils/vat'
import { toast } from 'sonner'

const COUNTRIES = [
  { code: 'FR', label: 'France', flag: '🇫🇷' },
  { code: 'DE', label: 'Germany', flag: '🇩🇪' },
  { code: 'ES', label: 'Spain', flag: '🇪🇸' },
  { code: 'IT', label: 'Italy', flag: '🇮🇹' },
  { code: 'NL', label: 'Netherlands', flag: '🇳🇱' },
  { code: 'BE', label: 'Belgium', flag: '🇧🇪' },
  { code: 'PT', label: 'Portugal', flag: '🇵🇹' },
  { code: 'AT', label: 'Austria', flag: '🇦🇹' },
  { code: 'SE', label: 'Sweden', flag: '🇸🇪' },
  { code: 'PL', label: 'Poland', flag: '🇵🇱' },
  { code: 'EU', label: 'Other EU', flag: '🌍' },
]

const CURRENCIES = ['EUR', 'GBP', 'SEK', 'PLN', 'CHF']
const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY']

type FormState = {
  name: string
  country_code: string
  vat_number: string
  vat_rate: string
  currency: string
  date_format: string
  logo_url: string
  ai_context: string
}

export default function BusinessTab() {
  const t = useTranslations('settings')
  const tc = useTranslations('common')
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FormState>({
    name: '',
    country_code: 'FR',
    vat_number: '',
    vat_rate: '20',
    currency: 'EUR',
    date_format: 'DD/MM/YYYY',
    logo_url: '',
    ai_context: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: userRow } = await supabase.from('users').select('business_id').eq('id', user.id).single()
      if (!userRow?.business_id) return
      setBusinessId(userRow.business_id)
      const { data: biz } = await supabase.from('businesses').select('*').eq('id', userRow.business_id).single()
      if (biz) {
        setForm({
          name: biz.name ?? '',
          country_code: biz.country_code ?? 'FR',
          vat_number: biz.vat_number ?? '',
          vat_rate: biz.vat_rate != null ? String(biz.vat_rate) : String(EU_VAT_RATES[biz.country_code] ?? 20),
          currency: (biz as any).currency ?? 'EUR',
          date_format: (biz as any).date_format ?? 'DD/MM/YYYY',
          logo_url: biz.logo_url ?? '',
          ai_context: (biz as any).ai_context ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  function handleCountryChange(code: string) {
    const defaultRate = EU_VAT_RATES[code] ?? 20
    setForm(f => ({ ...f, country_code: code, vat_rate: String(defaultRate) }))
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !businessId) return
    setUploadingLogo(true)
    const ext = file.name.split('.').pop()
    const path = `${businessId}/logo.${ext}`
    const { error } = await supabase.storage.from('business-logos').upload(path, file, { upsert: true })
    if (error) { toast.error('Logo upload failed'); setUploadingLogo(false); return }
    const { data: urlData } = supabase.storage.from('business-logos').getPublicUrl(path)
    setForm(f => ({ ...f, logo_url: urlData.publicUrl }))
    setUploadingLogo(false)
    toast.success('Logo uploaded')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return
    setSaving(true)
    const { error } = await supabase.from('businesses').update({
      name: form.name,
      country_code: form.country_code,
      vat_number: form.vat_number || null,
      vat_rate: parseFloat(form.vat_rate) || null,
      currency: form.currency,
      date_format: form.date_format,
      logo_url: form.logo_url || null,
      ai_context: form.ai_context || null,
    }).eq('id', businessId)
    setSaving(false)
    if (error) { toast.error('Failed to save changes'); return }
    toast.success('Changes saved')
  }

  if (loading) return <div style={loadingStyle}>{tc('loading')}</div>

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '560px' }}>
      {/* Business name */}
      <div>
        <label style={labelStyle}>{t('businessName')} <span style={{ color: 'var(--red)' }}>*</span></label>
        <input
          style={inputStyle}
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
        />
      </div>

      {/* Logo */}
      <div>
        <label style={labelStyle}>{t('businessLogo')}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {form.logo_url ? (
            <img src={form.logo_url} alt="logo" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-default)' }} />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--bg-muted)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              {form.name?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <button type="button" onClick={() => fileRef.current?.click()} style={secondaryBtnStyle} disabled={uploadingLogo}>
            {uploadingLogo ? t('uploadingLogo') : t('changeLogo')}
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
        </div>
      </div>

      {/* Country */}
      <div>
        <label style={labelStyle}>{t('countryRegion')}</label>
        <select style={selectStyle} value={form.country_code} onChange={e => handleCountryChange(e.target.value)}>
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>{c.flag} {c.label}</option>
          ))}
        </select>
      </div>

      {/* VAT number */}
      <div>
        <label style={labelStyle}>{t('vatNumber')}</label>
        <input
          style={inputStyle}
          value={form.vat_number}
          onChange={e => setForm(f => ({ ...f, vat_number: e.target.value }))}
          placeholder="e.g. FR12345678901"
        />
      </div>

      {/* VAT rate */}
      <div>
        <label style={labelStyle}>{t('vatRateLabel')}</label>
        <input
          type="number"
          min={0}
          max={100}
          step={0.1}
          style={{ ...inputStyle, width: 120 }}
          value={form.vat_rate}
          onChange={e => setForm(f => ({ ...f, vat_rate: e.target.value }))}
        />
      </div>

      {/* Currency */}
      <div>
        <label style={labelStyle}>{t('currency')}</label>
        <select style={selectStyle} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
          {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Date format */}
      <div>
        <label style={labelStyle}>{t('dateFormat')}</label>
        <select style={selectStyle} value={form.date_format} onChange={e => setForm(f => ({ ...f, date_format: e.target.value }))}>
          {DATE_FORMATS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* AI Context */}
      <div>
        <label style={labelStyle}>
          {t('aiContext')}{' '}
          <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '11px' }}>{t('aiContextMistralHint')}</span>
        </label>
        <textarea
          style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }}
          value={form.ai_context}
          onChange={e => setForm(f => ({ ...f, ai_context: e.target.value }))}
          placeholder={t('aiContextPlaceholder')}
        />
      </div>

      <div style={{ paddingTop: '4px' }}>
        <button type="submit" style={primaryBtnStyle} disabled={saving}>
          {saving ? t('savingChanges') : t('saveChanges')}
        </button>
      </div>
    </form>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }
const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', boxSizing: 'border-box' }
const selectStyle: React.CSSProperties = { width: '100%', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }
const primaryBtnStyle: React.CSSProperties = { background: 'var(--omnexia-accent)', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }
const secondaryBtnStyle: React.CSSProperties = { background: 'var(--bg-muted)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }
const loadingStyle: React.CSSProperties = { color: 'var(--text-muted)', fontSize: '13px', padding: '20px 0' }
