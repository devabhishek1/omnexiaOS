'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle, Mail } from 'lucide-react'
import { OnboardingData } from '../types'

interface Props {
  data: OnboardingData
  onChange: (partial: Partial<OnboardingData>) => void
  /**
   * Called by the parent wizard to advance to the next step.
   * We call this after a successful connect (auto-advance) or
   * when the user clicks the "skip" text link.
   * The parent passes this via the onAdvance prop added in page.tsx.
   */
  onAdvance: () => void
}

export default function Step6Gmail({ data, onChange, onAdvance }: Props) {
  const [connecting, setConnecting] = useState(false)

  // Detect successful OAuth return via localStorage flag set by the callback route
  useEffect(() => {
    const flag = localStorage.getItem('gmail_connected')
    const email = localStorage.getItem('gmail_email')
    if (flag === 'true') {
      localStorage.removeItem('gmail_connected')
      onChange({ gmailConnected: true, gmailEmail: email ?? undefined })
    }
  }, [onChange])

  // Auto-advance 1.5 s after connected state is set
  useEffect(() => {
    if (data.gmailConnected) {
      const t = setTimeout(() => onAdvance(), 1500)
      return () => clearTimeout(t)
    }
  }, [data.gmailConnected, onAdvance])

  async function handleConnect() {
    setConnecting(true)
    localStorage.setItem('onboarding_step', '6')
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes:
            'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar.readonly',
          redirectTo: `${window.location.origin}/api/auth/callback/google?from=onboarding`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) {
        console.error('Gmail OAuth error:', error.message)
        setConnecting(false)
      }
      // On success the browser redirects — don't reset state
    } catch (err) {
      console.error('Gmail connect error:', err)
      setConnecting(false)
    }
  }

  if (data.gmailConnected) {
    return (
      <div>
        <h1 style={headingStyle}>Connect your Gmail</h1>
        <p style={subtitleStyle}>Sync your inbox to manage all communications in one place.</p>
        <div
          style={{
            backgroundColor: 'var(--green-light)',
            border: '1px solid var(--green)',
            borderRadius: '12px',
            padding: '32px 24px',
            textAlign: 'center',
          }}
        >
          <CheckCircle
            size={40}
            color="var(--green)"
            style={{ margin: '0 auto 12px', display: 'block' }}
          />
          <p
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--green)',
              marginBottom: '4px',
            }}
          >
            Connected!
          </p>
          {data.gmailEmail && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '0' }}>
              {data.gmailEmail}
            </p>
          )}
          <p
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginTop: '16px',
            }}
          >
            Continuing automatically…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 style={headingStyle}>Connect your Gmail</h1>
      <p style={subtitleStyle}>Sync your inbox to manage all communications in one place.</p>

      {/* Info card */}
      <div
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
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
            <p
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
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

      {/* Primary action */}
      <button
        type="button"
        onClick={handleConnect}
        disabled={connecting}
        style={{
          width: '100%',
          backgroundColor: connecting ? 'var(--border-strong)' : 'var(--omnexia-accent)',
          color: '#FFFFFF',
          padding: '11px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          border: 'none',
          cursor: connecting ? 'not-allowed' : 'pointer',
          opacity: connecting ? 0.75 : 1,
          fontFamily: 'var(--font-dm-sans), sans-serif',
          marginBottom: '12px',
          transition: 'background-color 0.15s',
        }}
      >
        {connecting ? 'Connecting…' : 'Connect Gmail'}
      </button>

      {/* Skip link */}
      <button
        type="button"
        onClick={onAdvance}
        style={{
          background: 'none',
          border: 'none',
          width: '100%',
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '4px',
          fontFamily: 'var(--font-dm-sans), sans-serif',
          textDecoration: 'underline',
          textDecorationColor: 'var(--border-strong)',
        }}
      >
        You can connect Gmail later in Settings
      </button>
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
