'use client'

import React from 'react'
import { OnboardingData } from '../types'
import { useT } from '../LocaleContext'

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

const COUNTRY_DEFAULTS: Record<string, { vatRate: number; currency: string; dateFormat: string; vatNumberHint: string }> = {
  FR: { vatRate: 20, currency: 'EUR', dateFormat: 'DD/MM/YYYY', vatNumberHint: 'FR + 2 chars + 9 digits' },
  DE: { vatRate: 19, currency: 'EUR', dateFormat: 'DD/MM/YYYY', vatNumberHint: 'DE + 9 digits' },
  ES: { vatRate: 21, currency: 'EUR', dateFormat: 'DD/MM/YYYY', vatNumberHint: 'ES + letter + 7 digits + letter' },
  IT: { vatRate: 22, currency: 'EUR', dateFormat: 'DD/MM/YYYY', vatNumberHint: 'IT + 11 digits' },
  NL: { vatRate: 21, currency: 'EUR', dateFormat: 'DD/MM/YYYY', vatNumberHint: 'NL + 9 digits + B + 2 digits' },
  BE: { vatRate: 21, currency: 'EUR', dateFormat: 'DD/MM/YYYY', vatNumberHint: 'BE + 10 digits' },
  PT: { vatRate: 23, currency: 'EUR', dateFormat: 'DD/MM/YYYY', vatNumberHint: 'PT + 9 digits' },
  AT: { vatRate: 20, currency: 'EUR', dateFormat: 'DD/MM/YYYY', vatNumberHint: 'ATU + 8 digits' },
  SE: { vatRate: 25, currency: 'EUR', dateFormat: 'DD/MM/YYYY', vatNumberHint: 'SE + 12 digits' },
  PL: { vatRate: 23, currency: 'EUR', dateFormat: 'DD/MM/YYYY', vatNumberHint: 'PL + 10 digits' },
  EU: { vatRate: 20, currency: 'EUR', dateFormat: 'DD/MM/YYYY', vatNumberHint: 'Country code + digits' },
}

// Internal currency values stay as codes regardless of language
const CURRENCY_VALUES = ['EUR', 'GBP', 'SEK', 'PLN', 'CHF']
// Internal date format values stay as universal patterns
const DATE_FORMAT_VALUES = ['DD/MM/YYYY', 'MM/DD/YYYY']

interface Props {
  data: OnboardingData
  onChange: (partial: Partial<OnboardingData>) => void
}

export default function Step3Country({ data, onChange }: Props) {
  const t = useT()
  const s = t.s3

  function handleCountryChange(code: string) {
    const defaults = COUNTRY_DEFAULTS[code]
    onChange({
      countryCode: code,
      vatRate: defaults?.vatRate,
      currency: defaults?.currency ?? 'EUR',
      dateFormat: defaults?.dateFormat ?? 'DD/MM/YYYY',
      vatNumberHint: defaults?.vatNumberHint ?? '',
    })
  }

  return (
    <div>
      <h1 style={headingStyle}>{s.heading}</h1>
      <p style={subtitleStyle}>{s.subtitle}</p>

      <label htmlFor="ob-country" style={labelStyle}>
        {s.countryLabel} <span style={{ color: 'var(--red)' }}>*</span>
      </label>
      <select
        id="ob-country"
        value={data.countryCode}
        onChange={(e) => handleCountryChange(e.target.value)}
        style={selectStyle}
      >
        <option value="">{s.countryPlaceholder}</option>
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.label}
          </option>
        ))}
      </select>

      {data.countryCode && (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>{s.vatRate}</label>
            <input type="number" min={0} max={100} value={data.vatRate ?? ''} onChange={(e) => onChange({ vatRate: parseFloat(e.target.value) || 0 })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{s.currency}</label>
            <select value={data.currency ?? 'EUR'} onChange={(e) => onChange({ currency: e.target.value })} style={selectStyle}>
              {CURRENCY_VALUES.map((code, i) => (
                <option key={code} value={code}>{s.currencyOptions[i]}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{s.dateFormat}</label>
            <select value={data.dateFormat ?? 'DD/MM/YYYY'} onChange={(e) => onChange({ dateFormat: e.target.value })} style={selectStyle}>
              {DATE_FORMAT_VALUES.map((val, i) => (
                <option key={val} value={val}>{s.dateFormatOptions[i]}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{s.vatFormat}</label>
            <input type="text" value={data.vatNumberHint ?? ''} onChange={(e) => onChange({ vatNumberHint: e.target.value })} placeholder="e.g. FR + 2 chars + 9 digits" style={inputStyle} />
            <p style={{ fontSize: '11px', color: 'var(--text-disabled)', marginTop: '4px' }}>{s.vatHint}</p>
          </div>
        </div>
      )}

      {!data.countryCode && (
        <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
          {s.requiredHint}
        </p>
      )}
    </div>
  )
}

const headingStyle: React.CSSProperties = { fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.02em' }
const subtitleStyle: React.CSSProperties = { fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }
const selectStyle: React.CSSProperties = { width: '100%', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'border-color 0.15s' }
const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', boxSizing: 'border-box' }
