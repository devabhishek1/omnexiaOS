'use client'

import React, { useState, forwardRef } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ error, style, ...props }, ref) => {
    const [show, setShow] = useState(false)

    return (
      <div style={{ position: 'relative' }}>
        <input
          ref={ref}
          type={show ? 'text' : 'password'}
          style={{
            width: '100%',
            border: `1px solid ${error ? 'var(--red)' : 'var(--border-default)'}`,
            borderRadius: '8px',
            padding: '9px 40px 9px 12px',
            fontSize: '14px',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'var(--font-dm-sans), sans-serif',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--omnexia-accent)'
            e.currentTarget.style.boxShadow = '0 0 0 3px var(--omnexia-accent-light)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--red)' : 'var(--border-default)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            padding: '2px',
          }}
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
