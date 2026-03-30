'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft } from 'lucide-react'
import Step1Welcome from './steps/Step1Welcome'
import Step2Business from './steps/Step2Business'
import Step3Country from './steps/Step3Country'
import Step4Industry from './steps/Step4Industry'
import Step5Size from './steps/Step5Size'
import Step6Gmail from './steps/Step6Gmail'
import Step7Modules from './steps/Step7Modules'
import Step8Invite from './steps/Step8Invite'
import Step9Done from './steps/Step9Done'
import { OnboardingData } from './types'
export type { OnboardingData }

const TOTAL_STEPS = 9

// Steps that require a value before allowing Next
const REQUIRED_STEPS: Partial<Record<number, (d: OnboardingData) => boolean>> = {
  2: (d) => d.businessName.trim().length > 0,
  3: (d) => d.countryCode.length > 0,
  4: (d) => !!d.industry,
  5: (d) => !!d.companySize,
}

// Steps that show a "Skip" button instead of "Next" (no back-block)
// Step 6 and 8 have their own internal skip logic — excluded from the global skip
const SKIPPABLE_STEPS = new Set([4, 5, 7])

export default function OnboardingPage() {
  const router = useRouter()
  // supabase client — static browser client, instantiated once inside the component
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    locale: 'en',
    businessName: '',
    countryCode: '',
    activeModules: ['communications', 'finance', 'planning', 'team'],
    invitedEmails: [],
    gmailConnected: false,
  })

  // Restore from localStorage on mount (after Gmail OAuth redirect)
  useEffect(() => {
    const savedStep = localStorage.getItem('onboarding_step')
    const savedData = localStorage.getItem('onboarding_data')
    if (savedStep) setStep(parseInt(savedStep, 10))
    if (savedData) {
      try { setData(JSON.parse(savedData)) } catch { /* ignore corrupt data */ }
    }
  }, [])

  // Persist step to localStorage on every change
  useEffect(() => {
    localStorage.setItem('onboarding_step', step.toString())
  }, [step])

  function updateData(partial: Partial<OnboardingData>) {
    setData((prev) => {
      const next = { ...prev, ...partial }
      localStorage.setItem('onboarding_data', JSON.stringify(next))
      return next
    })
  }

  const canProgress = REQUIRED_STEPS[step] ? REQUIRED_STEPS[step]!(data) : true
  const isSkippable = SKIPPABLE_STEPS.has(step)
  const isLastStep = step === TOTAL_STEPS
  const isFirstStep = step === 1

  // Step 8 specific: show Continue when emails added, Skip when empty
  const isStep8 = step === 8
  const step8HasEmails = isStep8 && data.invitedEmails.length > 0

  // Step 6 and 9 manage their own navigation internals — hide global footer
  const hideGlobalButtons = step === 6

  function handleNext() {
    if (isLastStep) {
      handleFinish()
    } else {
      setStep((s) => s + 1)
    }
  }

  function handleBack() {
    if (!isFirstStep) setStep((s) => s - 1)
  }

  // Used by Step6Gmail onAdvance prop
  const handleAdvanceFromStep6 = useCallback(() => {
    setStep(7)
  }, [])

  async function handleFinish() {
    setSaving(true)
    try {
      // 1. Verify session client-side first (fast fail)
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('Onboarding: not authenticated')
        router.push('/login')
        return
      }

      // 2. Call the server-side API route which uses the admin client.
      //    This bypasses RLS entirely — the browser never writes to Supabase directly.
      const res = await fetch('/api/onboarding/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: data.businessName,
          countryCode: data.countryCode,
          industry: data.industry ?? null,
          locale: data.locale,
          companySize: data.companySize ?? null,
        }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Onboarding finish API error:', errBody)
        throw new Error(errBody.error ?? 'Finish API failed')
      }

      const { businessId } = await res.json()
      console.log('[onboarding] finish complete, businessId:', businessId)

      // 4. Upload logo if provided (uses businessId from API response)
      if (data.logoFile && businessId) {
        const ext = data.logoFile.name.split('.').pop()
        const { error: uploadError } = await supabase.storage
          .from('business-logos')
          .upload(`${businessId}/logo.${ext}`, data.logoFile, { upsert: true })
        if (uploadError) {
          console.warn('Logo upload failed (non-fatal):', uploadError.message)
        }
      }

      // Clear persisted onboarding state
      localStorage.removeItem('onboarding_step')
      localStorage.removeItem('onboarding_data')

      await new Promise((r) => setTimeout(r, 600))
      router.push('/overview')
    } catch (err) {
      console.error('Onboarding save error:', JSON.stringify(err), err)
      router.push('/overview')
    } finally {
      setSaving(false)
    }
  }

  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100

  const STEP_LABELS = [
    'Language', 'Business', 'Country', 'Industry', 'Team Size',
    'Gmail', 'Modules', 'Invite', 'Done',
  ]

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-base)',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px',
      }}
    >
      {/* Logo bar */}
      <div style={{ width: '100%', maxWidth: '520px', marginBottom: '24px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: '#1A1A1A',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '15px',
              letterSpacing: '-0.02em',
              fontFamily: 'var(--font-dm-sans), sans-serif',
            }}
          >
            O
          </span>
        </div>
      </div>

      {/* Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '520px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        }}
      >
        {/* Progress bar */}
        <div style={{ height: '4px', backgroundColor: 'var(--border-default)', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${progress}%`,
              backgroundColor: 'var(--omnexia-accent)',
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: '0 2px 2px 0',
            }}
          />
        </div>

        <div style={{ padding: '36px 40px 32px' }}>
          {/* Step counter */}
          <p
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--text-muted)',
              marginBottom: '20px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Step {step} of {TOTAL_STEPS} — {STEP_LABELS[step - 1]}
          </p>

          {/* Step content */}
          <div style={{ minHeight: '280px' }}>
            {step === 1 && <Step1Welcome data={data} onChange={updateData} />}
            {step === 2 && <Step2Business data={data} onChange={updateData} />}
            {step === 3 && <Step3Country data={data} onChange={updateData} />}
            {step === 4 && <Step4Industry data={data} onChange={updateData} />}
            {step === 5 && <Step5Size data={data} onChange={updateData} />}
            {step === 6 && (
              <Step6Gmail
                data={data}
                onChange={updateData}
                onAdvance={handleAdvanceFromStep6}
              />
            )}
            {step === 7 && <Step7Modules data={data} onChange={updateData} />}
            {step === 8 && <Step8Invite data={data} onChange={updateData} />}
            {step === 9 && <Step9Done data={data} saving={saving} />}
          </div>

          {/* Navigation — hidden on step 6 (handled internally) */}
          {!hideGlobalButtons && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '32px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-default)',
              }}
            >
              {/* Back */}
              {!isFirstStep ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 14px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-dm-sans), sans-serif',
                  }}
                >
                  <ChevronLeft size={14} />
                  Back
                </button>
              ) : (
                <div />
              )}

              {/* Right side buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Step 8: Skip when no emails, hidden when emails present */}
                {isStep8 && !step8HasEmails && (
                  <button
                    type="button"
                    onClick={handleNext}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                    }}
                  >
                    Skip
                  </button>
                )}

                {/* Standard skippable steps (4, 5, 7) */}
                {isSkippable && !isLastStep && (
                  <button
                    type="button"
                    onClick={handleNext}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                    }}
                  >
                    Skip
                  </button>
                )}

                {/* Next / Get Started / Continue / Go to Dashboard
                    On step 8: only show when emails are added OR it's not step 8 */}
                {(!isStep8 || step8HasEmails) && (
                  <button
                    id={`ob-step-${step}-next`}
                    type="button"
                    onClick={handleNext}
                    disabled={!canProgress || saving}
                    style={{
                      padding: '9px 20px',
                      backgroundColor: canProgress && !saving ? 'var(--omnexia-accent)' : 'var(--border-strong)',
                      color: canProgress && !saving ? '#FFFFFF' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: canProgress && !saving ? 'pointer' : 'not-allowed',
                      transition: 'background-color 0.15s ease',
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                    }}
                  >
                    {saving
                      ? 'Saving…'
                      : isLastStep
                      ? 'Go to Dashboard'
                      : isFirstStep
                      ? 'Get started'
                      : 'Continue'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
