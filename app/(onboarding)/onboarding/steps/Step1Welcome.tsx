'use client'

import React from 'react'
import { OnboardingData } from '../types'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'it', label: 'Italian', flag: '🇮🇹' },
  { code: 'nl', label: 'Dutch', flag: '🇳🇱' },
]

interface Props {
  data: OnboardingData
  onChange: (partial: Partial<OnboardingData>) => void
}

function detectBrowserLocale(): string {
  if (typeof navigator === 'undefined') return 'en'
  const lang = navigator.language?.split('-')[0] ?? 'en'
  return LANGUAGES.find((l) => l.code === lang)?.code ?? 'en'
}

export default function Step1Welcome({ data, onChange }: Props) {
  const detected = detectBrowserLocale()
  const detectedLang = LANGUAGES.find((l) => l.code === detected) ?? LANGUAGES[0]
  const current = LANGUAGES.find((l) => l.code === data.locale) ?? detectedLang

  return (
    <div>
      <h1 style={headingStyle}>Welcome to Omnexia</h1>
      <p style={subtitleStyle}>Your Business OS for Europe</p>

      <div
        style={{
          backgroundColor: 'var(--accent-light, #EEF3FE)',
          border: '1px solid var(--omnexia-accent-light, #EEF3FE)',
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: '24px',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '18px' }}>{detectedLang.flag}</span>
        We detected your language as{' '}
        <strong style={{ color: 'var(--text-primary)' }}>{detectedLang.label}</strong>
      </div>

      <label style={labelStyle}>Select your language</label>
      <select
        value={current.code}
        onChange={(e) => onChange({ locale: e.target.value })}
        style={selectStyle}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.label}
          </option>
        ))}
      </select>
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
}
