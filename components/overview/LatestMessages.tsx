'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/layout/Card'
import { SectionTitle } from '@/components/layout/SectionTitle'
import { Avatar } from '@/components/layout/Avatar'
import { ChannelBadge } from '@/components/layout/ChannelBadge'

type Channel = 'gmail' | 'instagram' | 'facebook'

interface MessageRow {
  id: string
  sender: string
  channel: Channel
  subject: string
  timestamp: string
  unread: boolean
}

function getInitials(name: string): string {
  return name
    .replace('@', '')
    .split(/[\s_]/)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatTimestamp(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  if (isToday) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  if (isYesterday) return 'Yesterday'
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function LatestMessages() {
  const router = useRouter()
  const t = useTranslations('overview')
  const [messages, setMessages] = useState<MessageRow[]>([])

  useEffect(() => {
    async function load() {
      // Use the server-side API which handles AES-256-GCM decryption of
      // participant_name, participant_email, and subject fields
      const res = await fetch('/api/gmail/conversations')
      if (!res.ok) return
      const { conversations } = await res.json()

      const rows: MessageRow[] = (conversations ?? [])
        .slice(0, 5)
        .map((conv: {
          id: string
          participantName: string
          participantEmail: string
          channel: string
          subject: string
          status: string
          lastMessageAt: string | null
        }) => ({
          id: conv.id,
          sender: conv.participantName || conv.participantEmail || 'Unknown',
          channel: (conv.channel as Channel) || 'gmail',
          subject: conv.subject || '',
          timestamp: formatTimestamp(conv.lastMessageAt),
          unread: conv.status === 'unread',
        }))

      setMessages(rows)
    }
    load()
  }, [])

  return (
    <Card>
      <SectionTitle>{t('latestMessages')}</SectionTitle>
      <div>
        {messages.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '12px 0' }}>
            {t('noMessages')}
          </p>
        ) : (
          messages.map((msg, idx) => (
            <button
              key={msg.id}
              onClick={() => router.push(`/communications`)}
              className="w-full text-left flex items-center gap-3"
              style={{
                padding: '12px 8px',
                borderTop: idx === 0 ? 'none' : '1px solid var(--border-default)',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background 0.1s',
                marginLeft: '-8px',
                marginRight: '-8px',
                boxSizing: 'content-box',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'var(--bg-elevated)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'transparent')
              }
            >
              <Avatar initials={getInitials(msg.sender)} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2" style={{ marginBottom: '2px' }}>
                  <span
                    style={{
                      fontWeight: msg.unread ? 600 : 500,
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '160px',
                    }}
                  >
                    {msg.sender}
                  </span>
                  <ChannelBadge channel={msg.channel} />
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {msg.subject}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span style={{ fontSize: '12px', color: 'var(--text-disabled)' }}>
                  {msg.timestamp}
                </span>
                {msg.unread && (
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--omnexia-accent)',
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </Card>
  )
}
