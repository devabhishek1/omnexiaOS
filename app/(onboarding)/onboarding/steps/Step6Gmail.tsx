'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Mail } from 'lucide-react'
import { OnboardingData } from '../types'
import { useT } from '../LocaleContext'

interface Props {
  data: OnboardingData
  onChange: (partial: Partial<OnboardingData>) => void
  onAdvance: () => void
}

export default function Step6Gmail({ data, onChange, onAdvance }: Props) {
  const [connecting, setConnecting] = useState(false)
  const searchParams = useSearchParams()
  const processed = useRef(false)
  const t = useT()
  const s = t.s6

  // Detect successful OAuth return via URL search params set by the callback route.
  // Use window.history.replaceState (not router.replace) to strip query params without
  // triggering a Next.js RSC fetch — router.replace causes a server round-trip that
  // fails and retries in an infinite loop.
  useEffect(() => {
    if (processed.current) return
    const gmailConnected = searchParams.get('gmail_connected')
    const gmailEmail = searchParams.get('gmail_email')
    if (gmailConnected === 'true') {
      processed.current = true
      window.history.replaceState({}, '', '/onboarding')
      onChange({ gmailConnected: true, gmailEmail: gmailEmail ?? undefined })
    } else if (gmailConnected === 'false') {
      // Token save failed — strip params, keep button enabled so user can retry
      window.history.replaceState({}, '', '/onboarding')
    }
  }, [searchParams, onChange])

  // Auto-advance 1.5s after connected state is set
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
          scopes: 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar.readonly',
          redirectTo: `${window.location.origin}/api/auth/callback/google?from=onboarding`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) {
        console.error('Gmail OAuth error:', error.message)
        setConnecting(false)
      }
    } catch (err) {
      console.error('Gmail connect error:', err)
      setConnecting(false)
    }
  }

  if (data.gmailConnected) {
    return (
      <div>
        <h1 style={headingStyle}>{s.heading}</h1>
        <p style={subtitleStyle}>{s.subtitle}</p>
        <div style={{ backgroundColor: 'var(--green-light)', border: '1px solid var(--green)', borderRadius: '12px', padding: '32px 24px', textAlign: 'center' }}>
          <CheckCircle size={40} color="var(--green)" style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--green)', marginBottom: '4px' }}>{s.connectedLabel}</p>
          {data.gmailEmail && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '0' }}>{data.gmailEmail}</p>
          )}
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px' }}>{s.connectedSub}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 style={headingStyle}>{s.heading}</h1>
      <p style={subtitleStyle}>{s.subtitle}</p>

      <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Mail size={20} color="#DC2626" />
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Gmail Connection</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Google OAuth 2.0 · Secure</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[s.permissionRead, s.permissionSync, s.permissionCalendar].map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={14} color="var(--green)" />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <button type="button" onClick={handleConnect} disabled={connecting} style={{ width: '100%', backgroundColor: connecting ? 'var(--border-strong)' : 'var(--omnexia-accent)', color: '#FFFFFF', padding: '11px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: connecting ? 'not-allowed' : 'pointer', opacity: connecting ? 0.75 : 1, fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '12px', transition: 'background-color 0.15s' }}>
        {connecting ? s.connecting : s.connect}
      </button>

      <button type="button" onClick={onAdvance} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', fontFamily: 'var(--font-dm-sans), sans-serif', textDecoration: 'underline', textDecorationColor: 'var(--border-strong)' }}>
        {s.skipLink}
      </button>
    </div>
  )
}

const headingStyle: React.CSSProperties = { fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.02em' }
const subtitleStyle: React.CSSProperties = { fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }
