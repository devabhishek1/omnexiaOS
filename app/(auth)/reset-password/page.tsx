'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { createClient } from '@/lib/supabase/client'
import { AuthCard } from '@/components/ui/auth-card'
import { ArrowLeft, CheckCircle } from 'lucide-react'

const resetSchema = z.object({
  email: z.email('Enter a valid email address'),
})

type ResetForm = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({ resolver: zodResolver(resetSchema) })

  async function onSubmit(data: ResetForm) {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (error) {
      setServerError(error.message)
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <main>
        <AuthCard>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: 'var(--green-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <CheckCircle size={24} color="var(--green)" />
            </div>
            <h1
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '10px',
              }}
            >
              Check your email
            </h1>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                lineHeight: '1.6',
                marginBottom: '28px',
              }}
            >
              We&apos;ve sent a password reset link to{' '}
              <strong style={{ color: 'var(--text-secondary)' }}>{getValues('email')}</strong>.
              Click the link in the email to reset your password.
            </p>
            <Link
              href="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--omnexia-accent)',
                fontSize: '13px',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={14} />
              Back to sign in
            </Link>
          </div>
        </AuthCard>
      </main>
    )
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
          Reset your password
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>
          Enter the email address associated with your account and we&apos;ll send you a reset link.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="reset-email" style={labelStyle}>
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              placeholder="jane@company.com"
              style={{
                width: '100%',
                border: `1px solid ${errors.email ? 'var(--red)' : 'var(--border-default)'}`,
                borderRadius: '8px',
                padding: '9px 12px',
                fontSize: '14px',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--omnexia-accent)'
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--omnexia-accent-light)'
              }}
              {...register('email', {
                onBlur: (e) => {
                  e.currentTarget.style.borderColor = errors.email ? 'var(--red)' : 'var(--border-default)'
                  e.currentTarget.style.boxShadow = 'none'
                },
              })}
            />
            {errors.email && <p style={errorStyle}>{errors.email.message}</p>}
          </div>

          {serverError && <div style={serverErrorStyle}>{serverError}</div>}

          <button
            id="reset-submit"
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              backgroundColor: 'var(--omnexia-accent)',
              color: '#FFFFFF',
              padding: '9px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              transition: 'background-color 0.15s ease',
              fontFamily: 'var(--font-dm-sans), sans-serif',
              marginBottom: '20px',
            }}
          >
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--omnexia-accent)',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </div>
      </AuthCard>
    </main>
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
