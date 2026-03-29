'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'
import type { User } from '@/types/database'
import { NotificationPanel } from './NotificationPanel'

const pageTitles: Record<string, string> = {
  overview: 'Overview',
  communications: 'Communications',
  finance: 'Finance',
  planning: 'Planning',
  team: 'Team & Roles',
  settings: 'Settings',
}

interface TopbarProps {
  user: User
}

export function Topbar({ user }: TopbarProps) {
  const pathname = usePathname()
  const [notifOpen, setNotifOpen] = useState(false)

  const segment = pathname.split('/').filter(Boolean)[0] ?? 'overview'
  const pageTitle = pageTitles[segment] ?? 'Omnexia'

  return (
    <header
      className="flex items-center justify-between relative"
      style={{
        height: '56px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-default)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        padding: '0 28px',
        flexShrink: 0,
      }}
    >
      {/* Left: page title */}
      <h1
        style={{
          fontSize: '16px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        {pageTitle}
      </h1>

      {/* Right: search + bell */}
      <div className="flex items-center gap-2.5">
        {/* Search bar */}
        <div
          className="flex items-center gap-2"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: '8px',
            padding: '7px 12px',
            width: '200px',
          }}
        >
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '13px',
              color: 'var(--text-primary)',
              width: '100%',
            }}
          />
        </div>

        {/* Notification bell */}
        <div className="relative">
          <button
            id="notification-bell"
            onClick={() => setNotifOpen((prev) => !prev)}
            aria-label="Notifications"
            style={{
              width: '36px',
              height: '36px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'var(--border-default)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'var(--bg-elevated)')
            }
          >
            {/* Bell SVG (lucide) */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--text-secondary)' }}
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </button>

          {notifOpen && (
            <NotificationPanel
              userId={user.id}
              businessId={user.business_id}
              onClose={() => setNotifOpen(false)}
            />
          )}
        </div>
      </div>
    </header>
  )
}
