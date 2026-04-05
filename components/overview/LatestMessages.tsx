'use client'

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

const MOCK_MESSAGES: MessageRow[] = [
  {
    id: '1',
    sender: 'Marie Dupont',
    channel: 'gmail',
    subject: 'Devis projet Q2',
    timestamp: '09:14',
    unread: true,
  },
  {
    id: '2',
    sender: '@boutique_leon',
    channel: 'instagram',
    subject: 'Question sur vos délais',
    timestamp: '08:52',
    unread: true,
  },
  {
    id: '3',
    sender: 'Paul Renard',
    channel: 'facebook',
    subject: 'Retour commande #4821',
    timestamp: '08:30',
    unread: false,
  },
  {
    id: '4',
    sender: 'Comptabilité KPMG',
    channel: 'gmail',
    subject: 'Rapport mensuel mars',
    timestamp: 'Yesterday',
    unread: false,
  },
  {
    id: '5',
    sender: '@creativestudio',
    channel: 'instagram',
    subject: 'Collaboration possible?',
    timestamp: 'Yesterday',
    unread: false,
  },
]

function getInitials(name: string) {
  return name
    .replace('@', '')
    .split(/[\s_]/)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function LatestMessages() {
  const router = useRouter()
  const t = useTranslations('overview')

  return (
    <Card>
      <SectionTitle>{t('latestMessages')}</SectionTitle>
      <div>
        {MOCK_MESSAGES.map((msg, idx) => (
          <button
            key={msg.id}
            onClick={() => router.push(`/communications/${msg.id}`)}
            className="w-full text-left flex items-center gap-3"
            style={{
              padding: '12px 0',
              borderTop: idx === 0 ? 'none' : '1px solid var(--border-default)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              borderRadius: '6px',
              transition: 'background 0.1s',
              paddingLeft: '8px',
              paddingRight: '8px',
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
        ))}
      </div>
    </Card>
  )
}
