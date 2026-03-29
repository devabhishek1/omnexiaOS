'use client'

import React from 'react'
import { OnboardingData } from '../types'

interface Props {
  data: OnboardingData
  saving: boolean
}

export default function Step9Done({ data, saving }: Props) {
  const COUNTRY_NAMES: Record<string, string> = {
    FR: '🇫🇷 France', DE: '🇩🇪 Germany', ES: '🇪🇸 Spain', IT: '🇮🇹 Italy',
    NL: '🇳🇱 Netherlands', BE: '🇧🇪 Belgium', PT: '🇵🇹 Portugal',
    AT: '🇦🇹 Austria', SE: '🇸🇪 Sweden', PL: '🇵🇱 Poland', EU: '🌍 Other EU',
  }

  const INDUSTRY_LABELS: Record<string, string> = {
    ecommerce: '🛍️ E-commerce', agency: '🏢 Agency', consulting: '💼 Consulting',
    retail: '🏪 Physical Retail', other: '🔧 Other',
  }

  const items = [
    { label: 'Business', value: data.businessName || '—' },
    { label: 'Country', value: data.countryCode ? COUNTRY_NAMES[data.countryCode] : '—' },
    { label: 'Industry', value: data.industry ? INDUSTRY_LABELS[data.industry] : 'Not specified' },
    { label: 'Team size', value: data.companySize ? `${data.companySize} employees` : 'Not specified' },
    { label: 'Gmail', value: data.gmailConnected ? '✅ Connected' : '⏭ Skipped' },
    { label: 'Modules', value: data.activeModules.join(', ') },
    {
      label: 'Invites',
      value: data.invitedEmails.length > 0 ? `${data.invitedEmails.length} invite(s) queued` : 'None',
    },
  ]

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
      <h1 style={{ ...headingStyle, marginBottom: '8px' }}>You&apos;re all set!</h1>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px' }}>
        Here&apos;s a summary of your Omnexia setup.
      </p>

      <div
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '8px',
          textAlign: 'left',
        }}
      >
        {items.map((item, i) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '11px 16px',
              borderTop: i > 0 ? '1px solid var(--border-default)' : 'none',
            }}
          >
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {item.label}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {saving && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          <div
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              border: '2px solid var(--omnexia-accent)',
              borderTopColor: 'transparent',
              animation: 'spin 0.7s linear infinite',
            }}
          />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Saving your workspace…</span>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const headingStyle: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 700,
  color: 'var(--text-primary)',
  letterSpacing: '-0.02em',
}
