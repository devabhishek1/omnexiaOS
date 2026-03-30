'use client'

import React, { useState } from 'react'
import {
  Inbox,
  MoreHorizontal,
  Tag,
  UserCircle,
  Mail,
  MailOpen,
  RefreshCw,
  Send,
  X,
} from 'lucide-react'
import type { Conversation, ConversationChannel, ThreadMessage } from './mock-data'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CHANNEL_CONFIG: Record<ConversationChannel, { label: string; bg: string; color: string }> = {
  gmail: { label: 'Gmail', bg: 'var(--gmail-light)', color: 'var(--gmail)' },
  instagram: { label: 'Instagram', bg: 'var(--instagram-light)', color: 'var(--instagram)' },
  facebook: { label: 'Facebook', bg: 'var(--facebook-light)', color: 'var(--facebook)' },
}

function ChannelBadge({ channel }: { channel: ConversationChannel }) {
  const c = CHANNEL_CONFIG[channel]
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.02em' }}>
      {c.label}
    </span>
  )
}

function getInitials(name: string) {
  return name.replace(/^@/, '').split(/[\s_]/).map((p) => p[0]).join('').toUpperCase().slice(0, 2)
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
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size > 32 ? '13px' : '11px', fontWeight: 700, flexShrink: 0, letterSpacing: '0.02em' }}>
      {getInitials(name)}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble({ msg }: { msg: ThreadMessage }) {
  const isOut = msg.direction === 'outbound'
  return (
    <div style={{ display: 'flex', flexDirection: isOut ? 'row-reverse' : 'row', gap: '10px', alignItems: 'flex-start', marginBottom: '16px' }}>
      <Avatar name={msg.senderName} size={32} />
      <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', alignItems: isOut ? 'flex-end' : 'flex-start', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexDirection: isOut ? 'row-reverse' : 'row' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{msg.senderName}</span>
          {!isOut && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{msg.senderEmail}</span>}
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{msg.timestamp}</span>
        </div>
        <div
          style={{
            background: isOut ? '#EFF6FF' : '#FFFFFF',
            border: `1px solid ${isOut ? '#BFDBFE' : 'var(--border-default)'}`,
            borderRadius: isOut ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
            padding: '10px 14px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          {msg.body}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AI Reply Panel
// ---------------------------------------------------------------------------

function AIReplyPanel({
  draft,
  onDismiss,
  onSend,
}: {
  draft: string
  onDismiss: () => void
  onSend: (text: string) => void
}) {
  const [text, setText] = useState(draft)

  return (
    <div
      style={{
        borderTop: '1px solid var(--border-default)',
        borderLeft: '3px solid var(--ai)',
        background: 'var(--ai-light)',
        padding: '14px 16px',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: 'var(--ai-light)', color: 'var(--ai)', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', border: '1px solid var(--ai-border)', letterSpacing: '0.05em' }}>
            ✦ AI
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ai)' }}>Suggested reply</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setText(draft)}
            title="Regenerate"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--ai)', fontSize: '12px', fontWeight: 500, cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            <RefreshCw size={12} /> Regenerate
          </button>
          <button
            onClick={onDismiss}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500, cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            <X size={12} /> Dismiss
          </button>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        style={{
          width: '100%',
          resize: 'vertical',
          border: '1px solid var(--ai-border)',
          borderRadius: '8px',
          padding: '10px 12px',
          fontSize: '13px',
          color: 'var(--text-primary)',
          background: '#FFFFFF',
          outline: 'none',
          lineHeight: 1.6,
          fontFamily: 'var(--font-dm-sans), sans-serif',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--ai)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--ai-light)' }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--ai-border)'; e.currentTarget.style.boxShadow = 'none' }}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
        <button
          onClick={() => onSend(text)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: 'var(--ai)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font-dm-sans), sans-serif',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          <Send size={13} /> Send Reply
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main ThreadView
// ---------------------------------------------------------------------------

const TEAM_MEMBERS = ['Unassigned', 'You', 'Marie Dubois', 'Luca Ferrari']

interface ThreadViewProps {
  conversation: Conversation | null
  showAIPanel: boolean
  priorityOnly: boolean
  onDismissAI: (id: string) => void
  onSendReply: (id: string, text: string) => void
  onMarkUnread: (id: string) => void
}

export function ThreadView({ conversation, showAIPanel, priorityOnly, onDismissAI, onSendReply, onMarkUnread }: ThreadViewProps) {
  const [assignedTo, setAssignedTo] = useState('Unassigned')
  const [showAssignDropdown, setShowAssignDropdown] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  // Empty: priority filter but no results
  if (!conversation && priorityOnly) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--bg-base)', color: 'var(--text-muted)' }}>
        <span style={{ fontSize: '28px' }}>⚡</span>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>No priority messages right now</p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Priority items will appear here when flagged</p>
      </div>
    )
  }

  // Empty: no conversation selected
  if (!conversation) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--bg-base)', color: 'var(--text-muted)' }}>
        <Inbox size={36} color="var(--text-disabled)" />
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Select a conversation to read</p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Choose a message from the left panel</p>
      </div>
    )
  }

  const isUnread = conversation.status === 'unread'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-surface)' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 20px',
          height: '56px',
          minHeight: '56px',
          borderBottom: '1px solid var(--border-default)',
          flexShrink: 0,
        }}
      >
        {/* Subject + channel */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {conversation.subject}
          </span>
          <ChannelBadge channel={conversation.channel} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Assign to */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowAssignDropdown(!showAssignDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', border: '1px solid var(--border-default)', borderRadius: '6px', background: 'var(--bg-base)', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
            >
              <UserCircle size={13} /> {assignedTo}
            </button>
            {showAssignDropdown && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: '#FFF', border: '1px solid var(--border-default)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '140px', overflow: 'hidden' }}>
                {TEAM_MEMBERS.map((m) => (
                  <button key={m} onClick={() => { setAssignedTo(m); setShowAssignDropdown(false) }} style={{ display: 'block', width: '100%', padding: '8px 14px', textAlign: 'left', background: m === assignedTo ? 'var(--accent-light)' : '#FFF', color: m === assignedTo ? 'var(--accent)' : 'var(--text-primary)', fontSize: '13px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: m === assignedTo ? 600 : 400 }}>
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Label */}
          <button
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', border: '1px solid var(--border-default)', borderRadius: '6px', background: 'var(--bg-base)', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            <Tag size={13} /> Label
          </button>

          {/* Mark read/unread */}
          <button
            onClick={() => onMarkUnread(conversation.id)}
            title={isUnread ? 'Mark as read' : 'Mark as unread'}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', border: '1px solid var(--border-default)', borderRadius: '6px', background: 'var(--bg-base)', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            {isUnread ? <MailOpen size={13} /> : <Mail size={13} />}
            {isUnread ? 'Read' : 'Unread'}
          </button>

          {/* More menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              style={{ display: 'flex', alignItems: 'center', padding: '5px 8px', border: '1px solid var(--border-default)', borderRadius: '6px', background: 'var(--bg-base)', cursor: 'pointer' }}
            >
              <MoreHorizontal size={15} color="var(--text-muted)" />
            </button>
            {showMoreMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: '#FFF', border: '1px solid var(--border-default)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '140px', overflow: 'hidden' }}>
                {['Archive', 'Move to folder', 'Delete'].map((action) => (
                  <button key={action} onClick={() => setShowMoreMenu(false)} style={{ display: 'block', width: '100%', padding: '8px 14px', textAlign: 'left', background: '#FFF', color: action === 'Delete' ? 'var(--red)' : 'var(--text-primary)', fontSize: '13px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                    {action}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message thread - scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
        {conversation.messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
      </div>

      {/* AI Reply Panel */}
      {showAIPanel && conversation.aiSuggestedReply && (
        <AIReplyPanel
          draft={conversation.aiSuggestedReply}
          onDismiss={() => onDismissAI(conversation.id)}
          onSend={(text) => onSendReply(conversation.id, text)}
        />
      )}
    </div>
  )
}
