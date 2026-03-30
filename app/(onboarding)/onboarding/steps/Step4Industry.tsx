'use client'

import React from 'react'
import { OnboardingData } from '../types'
import { useT } from '../LocaleContext'

const INDUSTRY_IDS = ['ecommerce', 'agency', 'consulting', 'retail', 'other'] as const
const INDUSTRY_EMOJIS = ['🛍️', '🏢', '💼', '🏪', '🔧']

interface Props {
  data: OnboardingData
  onChange: (partial: Partial<OnboardingData>) => void
}

export default function Step4Industry({ data, onChange }: Props) {
  const t = useT()
  const s = t.s4

  return (
    <div>
      <h1 style={headingStyle}>{s.heading}</h1>
      <p style={subtitleStyle}>{s.subtitle}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {s.industries.map((ind, i) => {
          const id = INDUSTRY_IDS[i]
          const isSelected = data.industry === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange({ industry: id })}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 16px', borderRadius: '10px',
                border: isSelected ? '2px solid var(--omnexia-accent)' : '1px solid var(--border-default)',
                backgroundColor: isSelected ? 'var(--omnexia-accent-light)' : 'var(--bg-surface)',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'all 0.12s ease', marginLeft: isSelected ? 0 : '1px',
              }}
            >
              <span style={{ fontSize: '24px', flexShrink: 0 }}>{INDUSTRY_EMOJIS[i]}</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: isSelected ? 'var(--omnexia-accent-text)' : 'var(--text-primary)', marginBottom: '2px' }}>
                  {ind.label}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
                  {ind.desc}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const headingStyle: React.CSSProperties = { fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.02em' }
const subtitleStyle: React.CSSProperties = { fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }
