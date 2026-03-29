'use client'

import React, { useRef } from 'react'
import { Upload } from 'lucide-react'
import { OnboardingData } from '../types'

interface Props {
  data: OnboardingData
  onChange: (partial: Partial<OnboardingData>) => void
}

export default function Step2Business({ data, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const previewUrl = data.logoFile ? URL.createObjectURL(data.logoFile) : null

  return (
    <div>
      <h1 style={headingStyle}>Tell us about your business</h1>
      <p style={subtitleStyle}>This information will appear throughout your workspace.</p>

      <div style={{ marginBottom: '24px' }}>
        <label htmlFor="ob-business-name" style={labelStyle}>
          Business name <span style={{ color: 'var(--red)' }}>*</span>
        </label>
        <input
          id="ob-business-name"
          type="text"
          placeholder="Acme Corp"
          value={data.businessName}
          onChange={(e) => onChange({ businessName: e.target.value })}
          style={inputStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--omnexia-accent)'
            e.currentTarget.style.boxShadow = '0 0 0 3px var(--omnexia-accent-light)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
      </div>

      <div>
        <label style={labelStyle}>
          Logo{' '}
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
        </label>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: '2px dashed var(--border-default)',
            borderRadius: '10px',
            padding: '28px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.15s, background-color 0.15s',
            backgroundColor: previewUrl ? 'var(--bg-elevated)' : 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--omnexia-accent)'
            e.currentTarget.style.backgroundColor = 'var(--omnexia-accent-light)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)'
            e.currentTarget.style.backgroundColor = previewUrl ? 'var(--bg-elevated)' : 'transparent'
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onChange({ logoFile: file })
            }}
          />
          {previewUrl ? (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Logo preview"
                style={{ height: '60px', objectFit: 'contain', margin: '0 auto 8px' }}
              />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {data.logoFile?.name} · Click to change
              </p>
            </div>
          ) : (
            <div>
              <Upload size={24} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Click to upload logo
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-disabled)', margin: '4px 0 0' }}>
                PNG, JPG, SVG — max 2MB
              </p>
            </div>
          )}
        </div>
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  padding: '9px 12px',
  fontSize: '14px',
  backgroundColor: 'var(--bg-surface)',
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-dm-sans), sans-serif',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
}
