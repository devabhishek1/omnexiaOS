'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { createClient } from '@/lib/supabase/client'
import { AuthCard } from '@/components/ui/auth-card'
import { GoogleButton } from '@/components/ui/google-button'
import { PasswordInput } from '@/components/ui/password-input'

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

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

export default function LoginPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginForm) {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setServerError(error.message)
      return
    }
    router.push('/onboarding')
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback/google`,
        scopes:
          'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar.readonly',
      },
    })
    setGoogleLoading(false)
  }

  return (
    <main>
      <AuthCard>
        <h1
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '6px',
            letterSpacing: '-0.01em',
          }}
        >
          Sign in to Omnexia
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>
          Welcome back. Enter your credentials to continue.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="login-email" style={labelStyle}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              style={{
                ...inputStyle,
                borderColor: errors.email ? 'var(--red)' : 'var(--border-default)',
              }}
              onFocus={focusInput}
              {...register('email', {
                onBlur: (e) => blurInput(e, !!errors.email),
              })}
            />
            {errors.email && <p style={errorStyle}>{errors.email.message}</p>}
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label htmlFor="login-password" style={labelStyle}>
              Password
            </label>
            <PasswordInput
              id="login-password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
            {errors.password && <p style={errorStyle}>{errors.password.message}</p>}
          </div>

          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            <Link href="/reset-password" style={linkStyle}>
              Forgot password?
            </Link>
          </div>

          {serverError && (
            <div style={serverErrorStyle}>
              {serverError}
            </div>
          )}

          <button
            id="login-submit"
            type="submit"
            disabled={isSubmitting}
            style={{
              ...primaryButtonStyle,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <Divider />

        <GoogleButton onClick={handleGoogle} loading={googleLoading} />

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ ...linkStyle, fontWeight: 600 }}>
            Sign up
          </Link>
        </p>
      </AuthCard>
    </main>
  )
}

function Divider() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        margin: '20px 0',
      }}
    >
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
