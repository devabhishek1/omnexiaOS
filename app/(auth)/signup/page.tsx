'use client'

import React, { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { createClient } from '@/lib/supabase/client'
import { AuthCard } from '@/components/ui/auth-card'
import { GoogleButton } from '@/components/ui/google-button'
import { PasswordInput } from '@/components/ui/password-input'

const signupSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type SignupForm = z.infer<typeof signupSchema>

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

function focusInput(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = 'var(--omnexia-accent)'
  e.currentTarget.style.boxShadow = '0 0 0 3px var(--omnexia-accent-light)'
}

function blurInput(e: React.FocusEvent<HTMLInputElement>, hasError: boolean) {
  e.currentTarget.style.borderColor = hasError ? 'var(--red)' : 'var(--border-default)'
  e.currentTarget.style.boxShadow = 'none'
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteBusinessId = searchParams.get('invite')
  const inviteEmail = searchParams.get('email')
  const isInvite = !!inviteBusinessId

  const [businessName, setBusinessName] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: inviteEmail ?? '' },
  })

  // Fetch business name to display on invite page
  useEffect(() => {
    if (!inviteBusinessId) return
    fetch(`/api/team/invite-info?invite=${inviteBusinessId}`)
      .then(r => r.json())
      .then(d => { if (d.businessName) setBusinessName(d.businessName) })
      .catch(() => {})
  }, [inviteBusinessId])

  async function onSubmit(data: SignupForm) {
    setServerError(null)
    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.fullName } },
    })
    if (error) {
      setServerError(error.message)
      return
    }

    if (isInvite) {
      // Link this user to the business — no onboarding needed
      const res = await fetch('/api/team/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: inviteBusinessId, inviteEmail: data.email }),
      })
      if (!res.ok) {
        setServerError('Failed to accept invitation. Please try again.')
        return
      }
      router.push('/overview')
    } else {
      router.push('/onboarding')
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    const supabase = createClient()
    const callbackUrl = new URL(`${window.location.origin}/api/auth/callback/google`)
    if (inviteBusinessId) callbackUrl.searchParams.set('invite', inviteBusinessId)
    if (inviteEmail) callbackUrl.searchParams.set('invite_email', inviteEmail)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
        // No gmail/calendar scopes — those are only for the business owner's Gmail connect in onboarding/settings
      },
    })
    setGoogleLoading(false)
  }

  return (
    <main>
      <AuthCard>
        {isInvite ? (
          <>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '6px',
                letterSpacing: '-0.01em',
              }}
            >
              {businessName ? `Join ${businessName}` : 'Accept your invitation'}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>
              {businessName
                ? `${businessName} has invited you to collaborate on Omnexia.`
                : 'Create your account to get started.'}
            </p>
          </>
        ) : (
          <>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '6px',
                letterSpacing: '-0.01em',
              }}
            >
              Create your account
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>
              Set up Omnexia for your business in minutes.
            </p>
          </>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="signup-name" style={labelStyle}>
              Full name
            </label>
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              placeholder="Jane Smith"
              style={{
                ...inputStyle,
                borderColor: errors.fullName ? 'var(--red)' : 'var(--border-default)',
              }}
              onFocus={focusInput}
              {...register('fullName', {
                onBlur: (e) => blurInput(e, !!errors.fullName),
              })}
            />
            {errors.fullName && <p style={errorStyle}>{errors.fullName.message}</p>}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="signup-email" style={labelStyle}>
              {isInvite ? 'Email' : 'Work email'}
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="jane@company.com"
              readOnly={!!inviteEmail}
              style={{
                ...inputStyle,
                borderColor: errors.email ? 'var(--red)' : 'var(--border-default)',
                backgroundColor: inviteEmail ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                color: inviteEmail ? 'var(--text-muted)' : 'var(--text-primary)',
              }}
              onFocus={inviteEmail ? undefined : focusInput}
              {...register('email', {
                onBlur: (e) => blurInput(e, !!errors.email),
              })}
            />
            {errors.email && <p style={errorStyle}>{errors.email.message}</p>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="signup-password" style={labelStyle}>
              Password
              <span style={{ color: 'var(--text-disabled)', fontWeight: 400, marginLeft: '6px' }}>
                — min. 8 characters
              </span>
            </label>
            <PasswordInput
              id="signup-password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
            />
            {errors.password && <p style={errorStyle}>{errors.password.message}</p>}
          </div>

          {serverError && <div style={serverErrorStyle}>{serverError}</div>}

          <button
            id="signup-submit"
            type="submit"
            disabled={isSubmitting}
            style={{
              ...primaryButtonStyle,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting
              ? isInvite ? 'Joining…' : 'Creating account…'
              : isInvite ? 'Join workspace' : 'Create account'}
          </button>
        </form>

        <Divider />

        <GoogleButton onClick={handleGoogle} loading={googleLoading} />

        {!isInvite && (
          <p
            style={{
              marginTop: '20px',
              textAlign: 'center',
              fontSize: '11px',
              color: 'var(--text-muted)',
              lineHeight: '1.5',
            }}
          >
            By signing up you agree to our{' '}
            <span style={{ color: 'var(--omnexia-accent)', cursor: 'pointer' }}>Terms of Service</span>
            {' '}and{' '}
            <span style={{ color: 'var(--omnexia-accent)', cursor: 'pointer' }}>Privacy Policy</span>
          </p>
        )}

        <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ ...linkStyle, fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </AuthCard>
    </main>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
      <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-default)' }} />
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>or</span>
      <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-default)' }} />
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: '6px',
}

const errorStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--red)',
  marginTop: '4px',
}

const serverErrorStyle: React.CSSProperties = {
  backgroundColor: 'var(--red-light)',
  border: '1px solid var(--red)',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '13px',
  color: 'var(--red)',
  marginBottom: '16px',
}

const primaryButtonStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'var(--omnexia-accent)',
  color: '#FFFFFF',
  padding: '9px 16px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  fontFamily: 'var(--font-dm-sans), sans-serif',
}

const linkStyle: React.CSSProperties = {
  color: 'var(--omnexia-accent)',
  fontSize: '13px',
  textDecoration: 'none',
}
