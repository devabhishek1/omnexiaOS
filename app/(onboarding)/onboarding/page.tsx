'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
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
}

// Steps that show a "Skip" button instead of "Next" (no back-block)
const SKIPPABLE_STEPS = new Set([4, 5, 6, 7, 8])

export default function OnboardingPage() {
  const router = useRouter()
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

  function updateData(partial: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...partial }))
  }

  const canProgress = REQUIRED_STEPS[step] ? REQUIRED_STEPS[step]!(data) : true
  const isSkippable = SKIPPABLE_STEPS.has(step)
  const isLastStep = step === TOTAL_STEPS
  const isFirstStep = step === 1

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

  async function handleFinish() {
    setSaving(true)
    try {
      // Supabase writes only happen when properly configured (real creds in .env.local)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (supabaseUrl && supabaseUrl !== 'placeholder') {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // 1. Create business row
          const { data: business, error: bizError } = await supabase
            .from('businesses')
            .insert({
              name: data.businessName,
              country: data.countryCode,
              industry: data.industry ?? null,
              locale: data.locale,
              size: data.companySize ?? null,
              owner_id: user.id,
            })
            .select('id')
            .single()

          if (bizError) throw bizError

          // 2. Update users row with business_id
          await supabase
            .from('users')
            .update({ business_id: business.id })
            .eq('id', user.id)

          // 3. Upload logo if provided
          if (data.logoFile && business?.id) {
            const ext = data.logoFile.name.split('.').pop()
            await supabase.storage
              .from('business-logos')
              .upload(`${business.id}/logo.${ext}`, data.logoFile, { upsert: true })
          }

          // 4. Mark onboarding complete
          await supabase.auth.updateUser({
            data: { onboarding_complete: true, business_id: business.id },
          })
        }
      }

      // Brief pause for UX, then redirect
      await new Promise((r) => setTimeout(r, 600))
      router.push('/overview')
    } catch (err) {
      console.error('Onboarding save error:', err)
      // Redirect anyway in dev / on error
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
            N
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
            {step === 6 && <Step6Gmail data={data} onChange={updateData} />}
            {step === 7 && <Step7Modules data={data} onChange={updateData} />}
            {step === 8 && <Step8Invite data={data} onChange={updateData} />}
            {step === 9 && <Step9Done data={data} saving={saving} />}
          </div>

          {/* Navigation */}
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
              {/* Skip (for skippable steps only) */}
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

              {/* Next / Get Started / Go to Dashboard */}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
