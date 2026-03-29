'use client'

import React from 'react'
import { OnboardingData } from '../types'

const SIZES = [
  { id: '1-10', label: '1–10', desc: 'Small team', emoji: '👤' },
  { id: '11-50', label: '11–50', desc: 'Growing team', emoji: '👥' },
  { id: '51-100', label: '51–100', desc: 'Medium business', emoji: '🏢' },
]

interface Props {
  data: OnboardingData
  onChange: (partial: Partial<OnboardingData>) => void
}

export default function Step5Size({ data, onChange }: Props) {
  return (
    <div>
      <h1 style={headingStyle}>How many employees do you have?</h1>
      <p style={subtitleStyle}>This helps us tailor your experience.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {SIZES.map((size) => {
          const isSelected = data.companySize === size.id
          return (
            <button
              key={size.id}
              type="button"
              onClick={() => onChange({ companySize: size.id })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '18px 20px',
                borderRadius: '10px',
                border: isSelected
                  ? '2px solid var(--omnexia-accent)'
                  : '1px solid var(--border-default)',
                backgroundColor: isSelected ? 'var(--omnexia-accent-light)' : 'var(--bg-surface)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.12s ease',
                marginLeft: isSelected ? 0 : '1px',
              }}
            >
              <span style={{ fontSize: '28px', flexShrink: 0 }}>{size.emoji}</span>
              <div>
                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: isSelected ? 'var(--omnexia-accent)' : 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    marginBottom: '2px',
                  }}
                >
                  {size.label}
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
  marginBottom: '24px',
}
