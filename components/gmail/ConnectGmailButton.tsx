'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  /** Where to redirect back after OAuth. 'dashboard' goes to /communications, 'settings' goes to /settings?tab=integrations */
  from: 'dashboard' | 'settings'
  onConnected?: (email: string) => void
}

export default function ConnectGmailButton({ from, onConnected }: Props) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'connected' | 'connecting' | 'error'>('checking')
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const processed = useRef(false)

  // Check if already connected on mount
  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStatus('idle'); return }
      const { data } = await supabase
        .from('gmail_tokens')
        .select('email, expires_at')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data?.email) {
        setConnectedEmail(data.email)
        setStatus('connected')
      } else {
        setStatus('idle')
      }
    }
    check()
  }, [])

  // Handle OAuth return via search params
  useEffect(() => {
    if (processed.current) return
    const gmailConnected = searchParams.get('gmail_connected')
    const gmailEmail = searchParams.get('gmail_email')
    const gmailError = searchParams.get('gmail_error')

    if (gmailConnected === 'true' && gmailEmail) {
      processed.current = true
      window.history.replaceState({}, '', window.location.pathname)
      setConnectedEmail(gmailEmail)
      setStatus('connected')
      onConnected?.(gmailEmail)
    } else if (gmailConnected === 'false') {
      processed.current = true
      window.history.replaceState({}, '', window.location.pathname)
      setErrorCode(gmailError ?? 'unknown')
      setStatus('error')
    }
  }, [searchParams, onConnected])

  async function handleConnect() {
    setStatus('connecting')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar.readonly',
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/api/auth/callback/google?from=${from}`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) {
      console.error('Gmail OAuth error:', error.message)
      setStatus('error')
      setErrorCode('oauth_init_failed')
    }
  }

  async function handleDisconnect() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('gmail_tokens').delete().eq('user_id', user.id)
    setConnectedEmail(null)
    setStatus('idle')
  }

  const errorMessages: Record<string, string> = {
    no_token: 'Google did not return an access token. Ask your admin to enable "Save provider tokens" in Supabase → Auth → Providers → Google.',
    save_failed: 'Token was received but could not be saved to the database.',
    crypto_error: 'Encryption failed — check that ENCRYPTION_KEY is set correctly in your environment.',
    unknown: 'Something went wrong. Please try again.',
    oauth_init_failed: 'Could not start the OAuth flow. Check your Google OAuth credentials.',
  }

  if (status === 'checking') return null

  if (status === 'connected') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px' }}>
        <CheckCircle size={18} color="#16A34A" />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#15803D', margin: 0 }}>Gmail connected</p>
          <p style={{ fontSize: '12px', color: '#16A34A', margin: '1px 0 0' }}>{connectedEmail}</p>
        </div>
        <button
          onClick={handleConnect}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', border: '1px solid #BBF7D0', background: 'none', fontSize: '12px', color: '#15803D', cursor: 'pointer' }}
        >
          <RefreshCw size={11} /> Reconnect
        </button>
        <button
          onClick={handleDisconnect}
          style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #FECACA', background: 'none', fontSize: '12px', color: '#DC2626', cursor: 'pointer' }}
        >
          Disconnect
        </button>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px' }}>
          <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} />
          <p style={{ fontSize: '12px', color: '#DC2626', margin: 0 }}>
            {errorMessages[errorCode ?? 'unknown'] ?? errorMessages.unknown}
          </p>
        </div>
        <button onClick={handleConnect} style={connectBtnStyle}>
          <Mail size={14} /> Try connecting again
        </button>
      </div>
    )
  }

  return (
    <button onClick={handleConnect} disabled={status === 'connecting'} style={{ ...connectBtnStyle, opacity: status === 'connecting' ? 0.7 : 1, cursor: status === 'connecting' ? 'not-allowed' : 'pointer' }}>
      <Mail size={14} />
      {status === 'connecting' ? 'Redirecting to Google…' : 'Connect Gmail'}
    </button>
  )
}

const connectBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  padding: '9px 16px',
  borderRadius: '8px',
  backgroundColor: 'var(--omnexia-accent)',
  color: '#fff',
  border: 'none',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
}
