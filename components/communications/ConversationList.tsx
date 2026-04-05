'use client'

import React, { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { Inbox } from 'lucide-react'
import type { Conversation, ConversationChannel } from './mock-data'
import ConnectGmailButton from '@/components/gmail/ConnectGmailButton'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string) {
  return name
    .replace(/^@/, '')
    .split(/[\s_]/)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const AVATAR_COLORS = [
  { bg: '#EEF3FE', text: '#2563EB' },
  { bg: '#FDF4FF', text: '#9333EA' },
  { bg: '#F0FDF4', text: '#16A34A' },
  { bg: '#FFFBEB', text: '#D97706' },
  { bg: '#FEF2F2', text: '#DC2626' },
  { bg: '#F0F0FF', text: '#6366F1' },
]

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  const { bg, text } = AVATAR_COLORS[idx]
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        color: text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size > 32 ? '13px' : '11px',
        fontWeight: 700,
        flexShrink: 0,
        letterSpacing: '0.02em',
      }}
    >
      {getInitials(name)}
    </div>
  )
}

const CHANNEL_CONFIG: Record<ConversationChannel, { label: string; bg: string; color: string }> = {
  gmail: { label: 'Gmail', bg: 'var(--gmail-light)', color: 'var(--gmail)' },
  instagram: { label: 'Instagram', bg: 'var(--instagram-light)', color: 'var(--instagram)' },
  facebook: { label: 'Facebook', bg: 'var(--facebook-light)', color: 'var(--facebook)' },
}

function ChannelBadge({ channel }: { channel: ConversationChannel }) {
  const c = CHANNEL_CONFIG[channel]
  return (
    <span
      style={{
        background: c.bg,
        color: c.color,
        fontSize: '10px',
        fontWeight: 600,
        padding: '2px 7px',
        borderRadius: '20px',
        letterSpacing: '0.02em',
        flexShrink: 0,
      }}
    >
      {c.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Single conversation row
// ---------------------------------------------------------------------------

function ConversationItem({
  conv,
  selected,
  onSelect,
}: {
  conv: Conversation
  selected: boolean
  onSelect: () => void
}) {
  const isUnread = conv.status === 'unread'
  const [hovered, setHovered] = React.useState(false)

  return (
    <button
      id={`conv-item-${conv.id}`}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 16px',
        width: '100%',
        textAlign: 'left',
        background: selected
          ? 'var(--accent-light)'
          : hovered
          ? 'var(--bg-elevated)'
          : 'var(--bg-surface)',
        border: 'none',
        borderBottom: '1px solid var(--border-default)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.1s',
        fontFamily: 'var(--font-dm-sans), sans-serif',
      }}
    >
      <Avatar name={conv.sender.name} size={36} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Sender + timestamp */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
          <span
            style={{
              fontSize: '13px',
              fontWeight: isUnread ? 700 : 500,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              marginRight: '6px',
            }}
          >
            {conv.sender.name}
            {conv.priority && <span style={{ marginLeft: '4px' }}>🔥</span>}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
            {conv.timestamp}
          </span>
        </div>

        {/* Channel badge + subject */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px', overflow: 'hidden' }}>
          <ChannelBadge channel={conv.channel} />
          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-primary)',
              fontWeight: isUnread ? 600 : 400,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {conv.subject}
          </span>
        </div>

        {/* Preview */}
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {conv.preview}
        </div>

        {/* Labels */}
        {conv.labels.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', marginTop: '5px', flexWrap: 'wrap' }}>
            {conv.labels.map((label) => (
              <span
                key={label}
                style={{
                  fontSize: '10px',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-muted)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-default)',
                }}
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Unread dot */}
      {isUnread && (
        <div
          style={{
            position: 'absolute',
            right: '12px',
            bottom: '12px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--accent)',
            flexShrink: 0,
          }}
        />
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Skeleton row for loading state
// ---------------------------------------------------------------------------

function ConversationSkeleton({ width }: { width: number }) {
  const rows = [200, 160, 240, 180, 210, 170, 230]
  return (
    <div style={{ width: `${width}px`, flexShrink: 0, borderRight: '1px solid var(--border-default)', overflowY: 'hidden', background: 'var(--bg-surface)' }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      {rows.map((w, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(90deg,#F0F0EE 25%,#E8E8E5 50%,#F0F0EE 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ width: 100, height: 11, borderRadius: 5, background: 'linear-gradient(90deg,#F0F0EE 25%,#E8E8E5 50%,#F0F0EE 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
              <div style={{ width: 36, height: 9, borderRadius: 5, background: 'linear-gradient(90deg,#F0F0EE 25%,#E8E8E5 50%,#F0F0EE 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
            </div>
            <div style={{ width: w, height: 10, borderRadius: 5, background: 'linear-gradient(90deg,#F0F0EE 25%,#E8E8E5 50%,#F0F0EE 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
            <div style={{ width: w - 40, height: 9, borderRadius: 5, background: 'linear-gradient(90deg,#F0F0EE 25%,#E8E8E5 50%,#F0F0EE 75%)', backgroundSize: '200% 100%', animation: `shimmer ${1.4 + i * 0.05}s infinite` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main ConversationList
// ---------------------------------------------------------------------------

interface ConversationListProps {
  conversations: Conversation[]
  allEmpty: boolean
  loading?: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onGmailConnected?: (email: string) => void
  width?: number
}

export function ConversationList({ conversations, allEmpty, loading, selectedId, onSelect, onGmailConnected, width = 320 }: ConversationListProps) {
  const t = useTranslations('communications')
  if (loading) {
    return <ConversationSkeleton width={width} />
  }
  if (allEmpty) {
    return (
      <div
        style={{
          width: `${width}px`,
          flexShrink: 0,
          borderRight: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          background: 'var(--bg-surface)',
          padding: '32px 24px',
          textAlign: 'center',
          overflowY: 'auto',
        }}
      >
        <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#EEF3FE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
          <Inbox size={28} color="#2563EB" />
        </div>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
          {t('noMessages')}
        </p>
        <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0, lineHeight: 1.5 }}>
          {t('connectGmail')}
        </p>
        <div style={{ marginTop: '12px', width: '100%' }}>
          <Suspense fallback={null}>
            <ConnectGmailButton from="dashboard" onConnected={onGmailConnected} />
          </Suspense>
        </div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div
        style={{
          width: `${width}px`,
          flexShrink: 0,
          borderRight: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: 'var(--bg-surface)',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <Inbox size={28} color="var(--text-disabled)" />
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
          {t('noConversations')}
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        width: `${width}px`,
        flexShrink: 0,
        borderRight: '1px solid var(--border-default)',
        overflowY: 'auto',
        background: 'var(--bg-surface)',
      }}
    >
      {conversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conv={conv}
          selected={selectedId === conv.id}
          onSelect={() => onSelect(conv.id)}
        />
      ))}
    </div>
  )
}
