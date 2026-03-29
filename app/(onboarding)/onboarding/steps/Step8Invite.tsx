'use client'

import React, { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { OnboardingData } from '../types'

interface Props {
  data: OnboardingData
  onChange: (partial: Partial<OnboardingData>) => void
}

export default function Step8Invite({ data, onChange }: Props) {
  const [inputVal, setInputVal] = useState('')
  const [error, setError] = useState('')

  function addEmail() {
    const email = inputVal.trim().toLowerCase()
    if (!email) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address')
      return
    }
    if (data.invitedEmails.includes(email)) {
      setError('Already added')
      return
    }
    onChange({ invitedEmails: [...data.invitedEmails, email] })
    setInputVal('')
    setError('')
  }

  function removeEmail(email: string) {
    onChange({ invitedEmails: data.invitedEmails.filter((e) => e !== email) })
  }

  return (
    <div>
      <h1 style={headingStyle}>Invite your team</h1>
      <p style={subtitleStyle}>Send invite links to your colleagues. They&apos;ll join as employees.</p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <input
          type="email"
          placeholder="colleague@company.com"
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value)
            setError('')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addEmail()
            }
          }}
          style={{
            flex: 1,
            border: `1px solid ${error ? 'var(--red)' : 'var(--border-default)'}`,
            borderRadius: '8px',
            padding: '9px 12px',
            fontSize: '14px',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            outline: 'none',
            fontFamily: 'var(--font-dm-sans), sans-serif',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--omnexia-accent)'
            e.currentTarget.style.boxShadow = '0 0 0 3px var(--omnexia-accent-light)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--red)' : 'var(--border-default)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        <button
          type="button"
          onClick={addEmail}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '9px 14px',
            backgroundColor: 'var(--omnexia-accent)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
            fontFamily: 'var(--font-dm-sans), sans-serif',
          }}
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {error && (
        <p style={{ fontSize: '12px', color: 'var(--red)', marginBottom: '8px' }}>{error}</p>
      )}

      {data.invitedEmails.length > 0 ? (
        <div
          style={{
            border: '1px solid var(--border-default)',
            borderRadius: '8px',
            overflow: 'hidden',
            marginTop: '12px',
          }}
        >
          {data.invitedEmails.map((email, i) => (
            <div
              key={email}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderTop: i > 0 ? '1px solid var(--border-default)' : 'none',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{email}</span>
              <button
                type="button"
                onClick={() => removeEmail(email)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                }}
                aria-label={`Remove ${email}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px' }}>
          No teammates added yet. You can also do this later in Settings.
        </p>
      )}
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
