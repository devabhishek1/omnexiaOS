'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  Inbox,
  Receipt,
  Calendar,
  Users,
  Settings,
  ChevronDown,
} from 'lucide-react'
import type { User, Business } from '@/types/database'

interface NavItem {
  href: string
  labelKey: string
  icon: React.ElementType
  badge?: number
}

const navItems: NavItem[] = [
  { href: '/overview', labelKey: 'overview', icon: LayoutDashboard },
  { href: '/communications', labelKey: 'communications', icon: Inbox },
  { href: '/finance', labelKey: 'finance', icon: Receipt },
  { href: '/planning', labelKey: 'planning', icon: Calendar },
  { href: '/team', labelKey: 'team', icon: Users },
  { href: '/settings', labelKey: 'settings', icon: Settings },
]

function getInitials(name: string | null) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

interface SidebarProps {
  user: User
  business: Business
}

export function Sidebar({ user, business }: SidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('nav')

  const isActive = (href: string) => {
    const segment = pathname.split('/').filter(Boolean)[0]
    return `/${segment}` === href
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="sidebar-shell fixed top-0 bottom-0 left-0 flex flex-col"
        style={{
          width: '220px',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-default)',
          zIndex: 40,
        }}
      >
        {/* Logo section */}
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                width: '32px',
                height: '32px',
                background: '#1A1A1A',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  color: '#FFF',
                  fontWeight: 800,
                  fontSize: '14px',
                  letterSpacing: '-0.5px',
                }}
              >
                O
              </span>
            </div>
            <div className="sidebar-label overflow-hidden">
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '15px',
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                Omnexia
              </div>
              <div
                style={{
                  fontWeight: 400,
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                Business OS
              </div>
            </div>
          </div>
        </div>

        {/* Business selector */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <button
            className="w-full flex items-center gap-2 rounded-[20px] text-left"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              padding: '8px 12px',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {/* Business avatar */}
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--omnexia-accent-light)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--omnexia-accent)',
              }}
            >
              {getInitials(business.name)}
            </div>
            <div className="sidebar-label flex-1 min-w-0">
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {business.name}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--omnexia-accent)',
                  background: 'var(--omnexia-accent-light)',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  display: 'inline-block',
                  marginTop: '1px',
                }}
              >
                Plan Pro
              </div>
            </div>
            <ChevronDown
              size={14}
              className="sidebar-label"
              style={{ color: 'var(--text-muted)', flexShrink: 0 }}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: '12px' }}>
          <ul className="flex flex-col gap-0.5" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {navItems.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2.5 rounded-lg"
                    style={{
                      padding: '9px 10px',
                      color: active ? 'var(--omnexia-accent)' : 'var(--text-muted)',
                      fontWeight: active ? 600 : 400,
                      fontSize: '14px',
                      background: active ? 'var(--omnexia-accent-light)' : 'transparent',
                      textDecoration: 'none',
                      transition: 'background 0.1s, color 0.1s',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'var(--bg-elevated)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    <Icon size={20} strokeWidth={active ? 2 : 1.75} />
                    <span className="sidebar-label flex-1">{t(item.labelKey)}</span>
                    {item.badge && item.badge > 0 && (
                      <span
                        style={{
                          background: 'var(--red)',
                          color: '#FFF',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '10px',
                          minWidth: '18px',
                          textAlign: 'center',
                          lineHeight: '16px',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User section */}
        <div
          style={{
            borderTop: '1px solid var(--border-default)',
            padding: '16px 20px',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                flexShrink: 0,
                letterSpacing: '0.02em',
              }}
            >
              {getInitials(user.full_name)}
            </div>
            <div className="sidebar-label min-w-0">
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.full_name ?? user.email}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  textTransform: 'capitalize',
                }}
              >
                {user.role}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Collapse overlay + CSS */}
      <style>{`
        @media (max-width: 1024px) {
          .sidebar-shell {
            width: 64px !important;
          }
          .sidebar-label {
            display: none !important;
          }
          .sidebar-shell nav a {
            justify-content: center;
            padding: 9px !important;
          }
        }
      `}</style>
    </>
  )
}
