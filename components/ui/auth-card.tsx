import React from 'react'

interface AuthCardProps {
  children: React.ReactNode
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-base)',
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '12px',
          padding: '40px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        }}
      >
        {/* Omnexia Logo */}
        <div style={{ marginBottom: '32px' }}>
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

        {children}
      </div>
    </div>
  )
}
