'use client'

import React from 'react'
import { OnboardingData } from '../types'

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

interface Props {
  data: OnboardingData
  onChange: (partial: Partial<OnboardingData>) => void
}

export default function Step3Country({ data, onChange }: Props) {
  const selected = COUNTRIES.find((c) => c.code === data.countryCode)

  return (
    <div>
      <h1 style={headingStyle}>Where is your business based?</h1>
      <p style={subtitleStyle}>This sets your language, VAT format, and currency.</p>

      <label htmlFor="ob-country" style={labelStyle}>
        Country / Region <span style={{ color: 'var(--red)' }}>*</span>
      </label>
      <select
        id="ob-country"
        value={data.countryCode}
        onChange={(e) => onChange({ countryCode: e.target.value })}
        style={{
          ...selectStyle,
          borderColor: !data.countryCode ? 'var(--border-default)' : 'var(--border-default)',
        }}
      >
        <option value="">Select a country…</option>
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.label}
          </option>
        ))}
      </select>

      {selected && (
        <div
          style={{
            marginTop: '16px',
            backgroundColor: 'var(--green-light)',
            border: '1px solid var(--green)',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '13px',
            color: 'var(--green)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <span style={{ fontWeight: 600 }}>{selected.flag} {selected.label} selected</span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
            Currency: EUR · VAT format: EU compliant · Date: DD/MM/YYYY
          </span>
        </div>
      )}

      {!data.countryCode && (
        <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Required — this affects VAT calculations across the app.
        </p>
      )}
    </div>
  )
}

const headingStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginBottom: '6px',
  letterSpacing: '-0.02em',
}

const subtitleStyle: React.CSSProperties = {
  fontSize: '14px',
  color: 'var(--text-muted)',
  marginBottom: '28px',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: '6px',
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  padding: '9px 12px',
  fontSize: '14px',
  backgroundColor: 'var(--bg-surface)',
  color: 'var(--text-primary)',
  outline: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-dm-sans), sans-serif',
  transition: 'border-color 0.15s',
}
