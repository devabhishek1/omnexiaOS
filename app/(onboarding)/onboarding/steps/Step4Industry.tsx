'use client'

import React from 'react'
import { OnboardingData } from '../types'

const INDUSTRIES = [
  { id: 'ecommerce', label: 'E-commerce', emoji: '🛍️', desc: 'Online store or marketplace' },
  { id: 'agency', label: 'Agency', emoji: '🏢', desc: 'Creative, digital, or media agency' },
  { id: 'consulting', label: 'Consulting', emoji: '💼', desc: 'Professional services & advisory' },
  { id: 'retail', label: 'Physical Retail', emoji: '🏪', desc: 'Stores, restaurants, hospitality' },
  { id: 'other', label: 'Other', emoji: '🔧', desc: "Doesn't fit the above" },
]

interface Props {
  data: OnboardingData
  onChange: (partial: Partial<OnboardingData>) => void
}

export default function Step4Industry({ data, onChange }: Props) {
  return (
    <div>
      <h1 style={headingStyle}>What type of business are you?</h1>
      <p style={subtitleStyle}>Select the option that best describes your business.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {INDUSTRIES.map((ind) => {
          const isSelected = data.industry === ind.id
          return (
            <button
              key={ind.id}
              type="button"
              onClick={() => onChange({ industry: ind.id })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
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
              <span style={{ fontSize: '24px', flexShrink: 0 }}>{ind.emoji}</span>
              <div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: isSelected ? 'var(--omnexia-accent-text)' : 'var(--text-primary)',
                    marginBottom: '2px',
                  }}
                >
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
