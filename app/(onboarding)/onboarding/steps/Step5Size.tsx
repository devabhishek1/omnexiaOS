'use client'

import React from 'react'
import { OnboardingData } from '../types'
import { useT } from '../LocaleContext'

const SIZE_IDS = ['1-10', '11-50', '51-100'] as const
const SIZE_LABELS = ['1–10', '11–50', '51–100']
const SIZE_EMOJIS = ['👤', '👥', '🏢']

interface Props {
  data: OnboardingData
  onChange: (partial: Partial<OnboardingData>) => void
}

export default function Step5Size({ data, onChange }: Props) {
  const t = useT()
  const s = t.s5

  return (
    <div>
      <h1 style={headingStyle}>{s.heading}</h1>
      <p style={subtitleStyle}>{s.subtitle}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {s.sizes.map((size, i) => {
          const id = SIZE_IDS[i]
          const isSelected = data.companySize === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange({ companySize: id })}
              style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '18px 20px', borderRadius: '10px',
                border: isSelected ? '2px solid var(--omnexia-accent)' : '1px solid var(--border-default)',
                backgroundColor: isSelected ? 'var(--omnexia-accent-light)' : 'var(--bg-surface)',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'all 0.12s ease', marginLeft: isSelected ? 0 : '1px',
              }}
            >
              <span style={{ fontSize: '28px', flexShrink: 0 }}>{SIZE_EMOJIS[i]}</span>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: isSelected ? 'var(--omnexia-accent)' : 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '2px' }}>
                  {SIZE_LABELS[i]}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{size.desc}</div>
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
