'use client'

import React from 'react'
import { OnboardingData } from '../types'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
]

// Minimal onboarding string translations keyed by locale
const T: Record<string, { heading: string; subtitle: string; label: string }> = {
  en: {
    heading: 'Welcome to Omnexia',
    subtitle: 'Your Business OS for Europe',
    label: 'Select your language to get started',
  },
  fr: {
    heading: 'Bienvenue sur Omnexia',
    subtitle: 'Votre OS professionnel pour l\'Europe',
    label: 'Sélectionnez votre langue pour commencer',
  },
  de: {
    heading: 'Willkommen bei Omnexia',
    subtitle: 'Ihr Business-OS für Europa',
    label: 'Wählen Sie Ihre Sprache, um zu beginnen',
  },
  es: {
    heading: 'Bienvenido a Omnexia',
    subtitle: 'Tu OS empresarial para Europa',
    label: 'Selecciona tu idioma para empezar',
  },
  it: {
    heading: 'Benvenuto su Omnexia',
    subtitle: 'Il tuo Business OS per l\'Europa',
    label: 'Seleziona la tua lingua per iniziare',
  },
  nl: {
    heading: 'Welkom bij Omnexia',
    subtitle: 'Uw Business OS voor Europa',
    label: 'Selecteer uw taal om te beginnen',
  },
}

interface Props {
  data: OnboardingData
  onChange: (partial: Partial<OnboardingData>) => void
}

export default function Step1Welcome({ data, onChange }: Props) {
  const locale = data.locale && T[data.locale] ? data.locale : 'en'
  const t = T[locale]

  function handleLocaleChange(code: string) {
    onChange({ locale: code })
  }

  return (
    <div>
      <h1 style={headingStyle}>{t.heading}</h1>
      <p style={subtitleStyle}>{t.subtitle}</p>

      <label style={labelStyle}>{t.label}</label>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginTop: '8px',
        }}
      >
        {LANGUAGES.map((l) => {
          const isSelected = locale === l.code
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => handleLocaleChange(l.code)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                border: `2px solid ${isSelected ? 'var(--omnexia-accent)' : 'var(--border-default)'}`,
                borderRadius: '10px',
                background: isSelected ? 'var(--omnexia-accent-light)' : 'var(--bg-surface)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.15s, background 0.15s',
                fontFamily: 'var(--font-dm-sans), sans-serif',
              }}
            >
              <span style={{ fontSize: '22px', lineHeight: 1 }}>{l.flag}</span>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? 'var(--omnexia-accent)' : 'var(--text-primary)',
                }}
              >
                {l.label}
              </span>
            </button>
          )
        })}
      </div>
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
