'use client'

import React from 'react'
import { Inbox, Receipt, Calendar, Users, Lock } from 'lucide-react'
import { OnboardingData } from '../types'

const MODULES = [
  {
    id: 'communications',
    label: 'Communications',
    desc: 'Unified inbox — Gmail & more',
    icon: Inbox,
    locked: true,
  },
  {
    id: 'finance',
    label: 'Finance',
    desc: 'Invoices & expenses',
    icon: Receipt,
    locked: false,
  },
  {
    id: 'planning',
    label: 'Planning',
    desc: 'Team scheduling & time-off',
    icon: Calendar,
    locked: false,
  },
  {
    id: 'team',
    label: 'Team & Roles',
    desc: 'Manage your team',
    icon: Users,
    locked: false,
  },
]

interface Props {
  data: OnboardingData
  onChange: (partial: Partial<OnboardingData>) => void
}

export default function Step7Modules({ data, onChange }: Props) {
  function toggleModule(id: string) {
    if (id === 'communications') return // locked
    const current = data.activeModules
    const next = current.includes(id) ? current.filter((m: string) => m !== id) : [...current, id]
    onChange({ activeModules: next })
  }

  return (
    <div>
      <h1 style={headingStyle}>Choose your modules</h1>
      <p style={subtitleStyle}>You can change this anytime in Settings.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {MODULES.map((mod) => {
          const isActive = data.activeModules.includes(mod.id)
          const Icon = mod.icon
          return (
            <div
              key={mod.id}
              onClick={() => toggleModule(mod.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
                borderRadius: '10px',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-surface)',
                cursor: mod.locked ? 'default' : 'pointer',
                transition: 'background-color 0.12s',
                opacity: mod.locked ? 0.9 : 1,
              }}
              onMouseEnter={(e) => {
                if (!mod.locked) e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-surface)'
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? 'var(--omnexia-accent-light)' : 'var(--bg-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={18} color={isActive ? 'var(--omnexia-accent)' : 'var(--text-muted)'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {mod.label}
                  </span>
                  {mod.locked && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '10px',
                        color: 'var(--text-muted)',
                        backgroundColor: 'var(--bg-elevated)',
                        borderRadius: '20px',
                        padding: '2px 7px',
                      }}
                    >
                      <Lock size={9} />
                      Required
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{mod.desc}</div>
              </div>
              {/* Toggle */}
              <div
                style={{
                  width: '40px',
                  height: '22px',
                  borderRadius: '11px',
                  backgroundColor: isActive ? 'var(--omnexia-accent)' : 'var(--border-strong)',
                  position: 'relative',
                  transition: 'background-color 0.2s',
                  flexShrink: 0,
                  opacity: mod.locked ? 0.6 : 1,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: isActive ? '21px' : '3px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
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
