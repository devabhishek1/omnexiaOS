'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types/database'
import { toast } from 'sonner'
import {
  Bell,
  Mail,
  AlertTriangle,
  Calendar,
  Gift,
} from 'lucide-react'

interface NotificationPanelProps {
  userId: string
  onClose: () => void
}

const iconMap: Record<Notification['type'], React.ElementType> = {
  message: Mail,
  invoice_overdue: AlertTriangle,
  time_off: Calendar,
  shift_conflict: Calendar,
  invite: Gift,
}

export function NotificationPanel({
  userId,
  onClose,
}: NotificationPanelProps) {
  const router = useRouter()
  const t = useTranslations('notifications')
  const tc = useTranslations('common')

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return t('justNow')
    if (mins < 60) return t('minutesAgo', { count: mins })
    const hours = Math.floor(mins / 60)
    if (hours < 24) return t('hoursAgo', { count: hours })
    return t('daysAgo', { count: Math.floor(hours / 24) })
  }
  const panelRef = useRef<HTMLDivElement>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const bell = document.getElementById('notification-bell')
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !bell?.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  // Fetch existing notifications (via server route that decrypts)
  const fetchNotifs = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/notifications')
    if (res.ok) {
      const { notifications: data } = await res.json()
      setNotifications((data as Notification[]) ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!cancelled) await fetchNotifs()
    })()
    return () => { cancelled = true }
  }, [fetchNotifs])

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          fetchNotifs()
          // Show toast for the new notification
          const n = payload.new as Partial<Notification>
          if (n?.title) {
            toast(n.title, {
              description: n.body ?? undefined,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId])

  // Mark all read
  async function markAllRead() {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: '360px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
        zIndex: 50,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <div className="flex items-center gap-2">
          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
            {t('title')}
          </span>
          {unreadCount > 0 && (
            <span
              style={{
                background: 'var(--red)',
                color: '#FFF',
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '10px',
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--omnexia-accent)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {t('markAllRead')}
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {loading ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '13px',
            }}
          >
            {tc('loading')}
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              padding: '48px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <Bell
              size={32}
              strokeWidth={1.5}
              style={{ margin: '0 auto 12px', display: 'block', color: 'var(--text-disabled)' }}
            />
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
              {t('noNotifications')}
            </div>
            <div style={{ fontSize: '12px' }}>
              {t('noNotificationsDesc')}
            </div>
          </div>
        ) : (
          notifications.map((notif) => {
            const Icon = iconMap[notif.type] ?? Bell
            return (
              <button
                key={notif.id}
                onClick={() => {
                  if (notif.link) router.push(notif.link)
                  onClose()
                }}
                className="w-full text-left flex items-start gap-3"
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid var(--border-default)',
                  background: notif.is_read ? 'transparent' : '#EEF3FE',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'background 0.1s',
                  display: 'flex',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'var(--bg-elevated)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = notif.is_read
                    ? 'transparent'
                    : '#EEF3FE')
                }
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'var(--bg-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={15} style={{ color: 'var(--omnexia-accent)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    style={{
                      fontWeight: notif.is_read ? 400 : 600,
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {notif.title}
                  </div>
                  {notif.body && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        marginTop: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {notif.body}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-disabled)',
                      marginTop: '4px',
                    }}
                  >
                    {timeAgo(notif.created_at)}
                  </div>
                </div>
                {!notif.is_read && (
                  <div
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: 'var(--omnexia-accent)',
                      flexShrink: 0,
                      marginTop: '4px',
                    }}
                  />
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
