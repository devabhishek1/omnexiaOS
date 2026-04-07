'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useRef, useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Inbox,
  Receipt,
  Calendar,
  Users,
  Settings,
  ChevronDown,
  Check,
  Building2,
} from 'lucide-react'
import { useDashboard } from './DashboardContext'
import type { User, Business } from '@/types/database'

interface NavItem {
  href: string
  labelKey: string
  icon: React.ElementType
  moduleKey?: keyof User['module_access'] // undefined = always visible to admins
  badge?: number
}

// All possible nav items.
// Items WITHOUT moduleKey = admin-only (Overview, Settings).
// Items WITH moduleKey = shown to employees only if module_access[key] === true.
const ALL_NAV_ITEMS: NavItem[] = [
  { href: '/overview', labelKey: 'overview', icon: LayoutDashboard },
  { href: '/communications', labelKey: 'communications', icon: Inbox, moduleKey: 'communications' },
  { href: '/finance', labelKey: 'finance', icon: Receipt, moduleKey: 'finance' },
  { href: '/planning', labelKey: 'planning', icon: Calendar, moduleKey: 'planning' },
  { href: '/team', labelKey: 'team', icon: Users, moduleKey: 'team' },
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

export function Sidebar({ user: _user, business: _business }: SidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const { user, business, allBusinesses, switchBusiness, switching } = useDashboard()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isAdmin = user.role === 'admin'
  const activeBizId = user.active_business_id ?? user.business_id

  const visibleItems = ALL_NAV_ITEMS.filter((item) => {
    if (!item.moduleKey) return isAdmin
    return user.module_access?.[item.moduleKey] === true
  })

  const isActive = (href: string) => {
    const segment = pathname.split('/').filter(Boolean)[0]
    return `/${segment}` === href
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  function BusinessAvatar({ logoUrl, name, size = 28 }: { logoUrl: string | null; name: string; size?: number }) {
    if (logoUrl) {
      return (
        <img
          src={logoUrl}
          alt={name}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '1px solid var(--border-default)',
            flexShrink: 0,
          }}
        />
      )
    }
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'var(--omnexia-accent-light)',
          border: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: size < 32 ? '11px' : '13px',
          fontWeight: 700,
          color: 'var(--omnexia-accent)',
        }}
      >
        {getInitials(name)}
      </div>
    )
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
          ref={dropdownRef}
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-default)',
            position: 'relative',
          }}
        >
          <button
            className="w-full flex items-center gap-2 rounded-[20px] text-left"
            style={{
              background: dropdownOpen ? 'var(--bg-elevated)' : 'var(--bg-elevated)',
              border: `1px solid ${dropdownOpen ? 'var(--omnexia-accent)' : 'var(--border-default)'}`,
              padding: '8px 12px',
              cursor: switching ? 'wait' : 'pointer',
              transition: 'border-color 0.15s',
              opacity: switching ? 0.6 : 1,
            }}
            onClick={() => !switching && setDropdownOpen((o) => !o)}
          >
            {/* Business logo or initials */}
            <BusinessAvatar logoUrl={business.logo_url} name={business.name} size={28} />

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
                  textTransform: 'capitalize',
                }}
              >
                {user.role}
              </div>
            </div>
            <ChevronDown
              size={14}
              className="sidebar-label"
              style={{
                color: 'var(--text-muted)',
                flexShrink: 0,
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s',
              }}
            />
          </button>

          {/* Dropdown */}
          {dropdownOpen && allBusinesses.length > 0 && (
            <div
              className="sidebar-label"
              style={{
                position: 'absolute',
                top: 'calc(100% - 4px)',
                left: '12px',
                right: '12px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
                zIndex: 50,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '6px 10px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid var(--border-default)',
                }}
              >
                Your workspaces
              </div>
              {allBusinesses.map((membership) => {
                const biz = membership.business
                if (!biz) return null
                const isCurrentBiz = biz.id === activeBizId
                return (
                  <button
                    key={biz.id}
                    className="w-full flex items-center gap-2 text-left"
                    style={{
                      padding: '9px 12px',
                      background: isCurrentBiz ? 'var(--omnexia-accent-light)' : 'transparent',
                      cursor: isCurrentBiz ? 'default' : 'pointer',
                      transition: 'background 0.1s',
                      border: 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrentBiz) e.currentTarget.style.background = 'var(--bg-elevated)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrentBiz) e.currentTarget.style.background = 'transparent'
                    }}
                    onClick={async () => {
                      if (!isCurrentBiz) {
                        setDropdownOpen(false)
                        await switchBusiness(biz.id)
                      }
                    }}
                  >
                    <BusinessAvatar logoUrl={biz.logo_url} name={biz.name} size={26} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: isCurrentBiz ? 'var(--omnexia-accent)' : 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {biz.name}
                      </div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          textTransform: 'capitalize',
                        }}
                      >
                        {membership.role}
                      </div>
                    </div>
                    {isCurrentBiz && (
                      <Check size={12} style={{ color: 'var(--omnexia-accent)', flexShrink: 0 }} />
                    )}
                  </button>
                )
              })}

              {/* Add new business option */}
              <div style={{ borderTop: '1px solid var(--border-default)' }}>
                <a
                  href="/onboarding?new=1"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 12px',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    textDecoration: 'none',
                    transition: 'background 0.1s, color 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-elevated)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-muted)'
                  }}
                >
                  <Building2 size={14} />
                  <span>Add new business</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: '12px' }}>
          <ul className="flex flex-col gap-0.5" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {visibleItems.map((item) => {
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
