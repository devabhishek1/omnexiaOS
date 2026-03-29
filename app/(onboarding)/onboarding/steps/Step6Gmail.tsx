'use client'

import React, { useState } from 'react'
import { CheckCircle, Mail } from 'lucide-react'
import { OnboardingData } from '../types'

interface Props {
  data: OnboardingData
  onChange: (partial: Partial<OnboardingData>) => void
}

export default function Step6Gmail({ data, onChange }: Props) {
  const [connecting, setConnecting] = useState(false)

  function handleConnect() {
    setConnecting(true)
    // In a real app this would trigger Google OAuth with Gmail scopes.
    // During scaffold/dev we simulate the connected state.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === 'placeholder') {
      // Dev mode: simulate connection
      setTimeout(() => {
        onChange({ gmailConnected: true })
        setConnecting(false)
      }, 800)
      return
    }
    // Production: trigger real OAuth
    window.location.href = `/api/auth/callback/google?scope=gmail`
  }

  return (
    <div>
      <h1 style={headingStyle}>Connect your Gmail</h1>
      <p style={subtitleStyle}>Required to use the Communications module.</p>

      {data.gmailConnected ? (
        <div
          style={{
            backgroundColor: 'var(--green-light)',
            border: '1px solid var(--green)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          <CheckCircle size={36} color="var(--green)" style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--green)', marginBottom: '4px' }}>
            Gmail connected!
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Your inbox is ready to sync.
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              {/* Gmail logo */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Mail size={20} color="#DC2626" />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Gmail Connection
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  Google OAuth 2.0 · Secure
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                'Read and send emails on your behalf',
                'Sync your inbox to Omnexia',
                'Calendar availability (optional)',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={14} color="var(--green)" />
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleConnect}
            disabled={connecting}
            style={{
              width: '100%',
              backgroundColor: 'var(--omnexia-accent)',
              color: '#FFFFFF',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: connecting ? 'not-allowed' : 'pointer',
              opacity: connecting ? 0.7 : 1,
              fontFamily: 'var(--font-dm-sans), sans-serif',
              marginBottom: '12px',
            }}
          >
            {connecting ? 'Connecting…' : 'Connect Gmail'}
          </button>
        </>
      )}

      <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-disabled)' }}>
        You can connect Gmail later in Settings.
      </p>
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
