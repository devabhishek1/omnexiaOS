'use client'

import React, { useState, useRef, useEffect } from 'react'
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
  Trash2,
  Paperclip,
} from 'lucide-react'
import type { Conversation, ConversationChannel, ThreadMessage } from './mock-data'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CHANNEL_CONFIG: Record<ConversationChannel, { label: string; bg: string; color: string }> = {
  gmail: { label: 'Gmail', bg: '#FEE2E2', color: '#DC2626' },
  instagram: { label: 'Instagram', bg: '#FDF4FF', color: '#9333EA' },
  facebook: { label: 'Facebook', bg: '#EEF3FE', color: '#2563EB' },
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
// Message bubble — WhatsApp-style
// ---------------------------------------------------------------------------

/** Renders body text: plain lines, and URLs as clickable links */
function MessageBody({ text }: { text: string }) {
  const urlPattern = /https?:\/\/[^\s)>]+/g
  const parts = text.split('\n')
  return (
    <>
      {parts.map((line, i) => {
        if (!line.trim()) return <br key={i} />
        const segments: React.ReactNode[] = []
        let last = 0
        let match
        urlPattern.lastIndex = 0
        while ((match = urlPattern.exec(line)) !== null) {
          if (match.index > last) segments.push(line.slice(last, match.index))
          const url = match[0].replace(/[.,;:!?)]+$/, '') // trim trailing punctuation
          segments.push(
            <a key={match.index} href={url} target="_blank" rel="noopener noreferrer"
              style={{ color: 'inherit', textDecoration: 'underline', wordBreak: 'break-all', opacity: 0.85 }}>
              {url}
            </a>
          )
          last = match.index + url.length
        }
        if (last < line.length) segments.push(line.slice(last))
        return <div key={i} style={{ lineHeight: 1.55 }}>{segments}</div>
      })}
    </>
  )
}

function MessageBubble({ msg }: { msg: ThreadMessage }) {
  const isOut = msg.direction === 'outbound'

  const bubbleStyle: React.CSSProperties = isOut
    ? {
        background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
        color: '#FFFFFF',
        borderRadius: '16px 16px 4px 16px',
        boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
      }
    : {
        background: '#FFFFFF',
        color: '#1A1A1A',
        borderRadius: '16px 16px 16px 4px',
        border: '1px solid #E8E8E2',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }

  return (
    <div style={{
      display: 'flex',
      flexDirection: isOut ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: '8px',
      marginBottom: '12px',
      paddingLeft: isOut ? '60px' : '0',
      paddingRight: isOut ? '0' : '60px',
    }}>
      {/* Avatar — only show for inbound */}
      {!isOut && <Avatar name={msg.senderName} size={28} />}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOut ? 'flex-end' : 'flex-start', gap: '3px', maxWidth: '72%' }}>
        {/* Sender name — only for inbound */}
        {!isOut && (
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', paddingLeft: '4px' }}>
            {msg.senderName}
          </span>
        )}

        {/* Bubble */}
        <div style={{ ...bubbleStyle, padding: '9px 13px', fontSize: '13px', lineHeight: 1.55, wordBreak: 'break-word' }}>
          <MessageBody text={msg.body} />
        </div>

        {/* Timestamp */}
        <span style={{ fontSize: '10px', color: '#9CA3AF', paddingLeft: isOut ? 0 : '4px', paddingRight: isOut ? '4px' : 0 }}>
          {msg.timestamp}
        </span>
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
  onUseDraft,
}: {
  draft: string
  onDismiss: () => void
  onUseDraft: (text: string) => void
}) {
  const [text, setText] = useState(draft)

  return (
    <div
      style={{
        borderTop: '1px solid #E8E8E2',
        borderLeft: '3px solid #6366F1',
        background: '#F5F3FF',
        padding: '14px 16px',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: '#EDE9FE', color: '#6366F1', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', border: '1px solid #C4B5FD', letterSpacing: '0.05em' }}>
            ✦ AI Draft
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#4338CA' }}>Suggested reply</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setText(draft)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#6366F1', fontSize: '12px', fontWeight: 500, cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            <RefreshCw size={12} /> Regenerate
          </button>
          <button
            onClick={onDismiss}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#9CA3AF', fontSize: '12px', fontWeight: 500, cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            <X size={12} /> Dismiss
          </button>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        style={{
          width: '100%',
          resize: 'vertical',
          border: '1px solid #C4B5FD',
          borderRadius: '8px',
          padding: '10px 12px',
          fontSize: '13px',
          color: '#1A1A1A',
          background: '#FFFFFF',
          outline: 'none',
          lineHeight: 1.6,
          fontFamily: 'var(--font-dm-sans), sans-serif',
          boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
        <button
          onClick={() => onUseDraft(text)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 16px',
            background: '#6366F1', color: '#FFFFFF',
            border: 'none', borderRadius: '8px',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif',
          }}
        >
          Use this draft →
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
  businessName: string
  onDismissAI: (id: string) => void
  onSendReply: (id: string, text: string, files?: File[]) => void
  onMarkUnread: (id: string) => void
}

export function ThreadView({ conversation, showAIPanel, priorityOnly, businessName, onDismissAI, onSendReply, onMarkUnread }: ThreadViewProps) {
  const [assignedTo, setAssignedTo] = useState('Unassigned')
  const [showAssignDropdown, setShowAssignDropdown] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [composerText, setComposerText] = useState('')

  // Keep local composer state available for "Use this draft"
  const composerRef = useRef<HTMLTextAreaElement | null>(null)

  // Empty: priority filter but no results
  if (!conversation && priorityOnly) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#F9F9F6' }}>
        <span style={{ fontSize: '36px' }}>⚡</span>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>You're all caught up!</p>
        <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>No priority messages right now 🎉</p>
      </div>
    )
  }

  // Empty: no conversation selected
  if (!conversation) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#F9F9F6' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
          <Inbox size={28} color="#9CA3AF" />
        </div>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>Select a conversation to read</p>
        <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>Choose a message from the left panel</p>
      </div>
    )
  }

  const isUnread = conversation.status === 'unread'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#FFFFFF' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 20px',
          height: '56px',
          minHeight: '56px',
          borderBottom: '1px solid #E8E8E2',
          flexShrink: 0,
        }}
      >
        {/* Subject + channel */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {conversation.subject}
          </span>
          <ChannelBadge channel={conversation.channel} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Assign to — front and centre, prominent */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowAssignDropdown(!showAssignDropdown)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px',
                border: '1.5px solid #2563EB',
                borderRadius: '8px',
                background: '#EEF3FE',
                fontSize: '12px', fontWeight: 600,
                color: '#2563EB',
                cursor: 'pointer',
                fontFamily: 'var(--font-dm-sans), sans-serif',
              }}
            >
              <UserCircle size={14} />
              {assignedTo === 'Unassigned' ? 'Assign to…' : assignedTo}
            </button>
            {showAssignDropdown && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: '#FFF', border: '1px solid #E8E8E2', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, minWidth: '160px', overflow: 'hidden' }}>
                {TEAM_MEMBERS.map((m) => (
                  <button key={m} onClick={() => { setAssignedTo(m); setShowAssignDropdown(false) }} style={{ display: 'block', width: '100%', padding: '9px 14px', textAlign: 'left', background: m === assignedTo ? '#EEF3FE' : '#FFF', color: m === assignedTo ? '#2563EB' : '#1A1A1A', fontSize: '13px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: m === assignedTo ? 600 : 400 }}>
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Label */}
          <button style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', border: '1px solid #E8E8E2', borderRadius: '6px', background: '#F9F9F6', fontSize: '12px', color: '#6B6B6B', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            <Tag size={13} /> Label
          </button>

          {/* Mark read/unread */}
          <button
            onClick={() => onMarkUnread(conversation.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', border: '1px solid #E8E8E2', borderRadius: '6px', background: '#F9F9F6', fontSize: '12px', color: '#6B6B6B', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            {isUnread ? <MailOpen size={13} /> : <Mail size={13} />}
            {isUnread ? 'Read' : 'Unread'}
          </button>

          {/* More menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              style={{ display: 'flex', alignItems: 'center', padding: '5px 8px', border: '1px solid #E8E8E2', borderRadius: '6px', background: '#F9F9F6', cursor: 'pointer' }}
            >
              <MoreHorizontal size={15} color="#9CA3AF" />
            </button>
            {showMoreMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: '#FFF', border: '1px solid #E8E8E2', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, minWidth: '140px', overflow: 'hidden' }}>
                {['Archive', 'Move to folder', 'Delete'].map((action) => (
                  <button key={action} onClick={() => setShowMoreMenu(false)} style={{ display: 'block', width: '100%', padding: '9px 14px', textAlign: 'left', background: '#FFF', color: action === 'Delete' ? '#DC2626' : '#1A1A1A', fontSize: '13px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                    {action}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sender info bar */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid #E8E8E2', background: '#FAFAFA', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <Avatar name={conversation.sender.name} size={32} />
        <div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>{conversation.sender.name}</span>
          <span style={{ fontSize: '12px', color: '#9CA3AF', marginLeft: '6px' }}>&lt;{conversation.sender.email}&gt;</span>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#9CA3AF' }}>via Gmail · {conversation.timestamp}</span>
      </div>

      {/* Message thread - scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', background: '#F0F4F8' }}>
        {conversation.messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px', marginTop: '40px' }}>
            No messages in this thread yet.
          </div>
        ) : (
          conversation.messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))
        )}
      </div>

      {/* AI Reply Panel — "Use this draft" copies to composer */}
      {showAIPanel && conversation.aiSuggestedReply && (
        <AIReplyPanel
          draft={conversation.aiSuggestedReply}
          onDismiss={() => onDismissAI(conversation.id)}
          onUseDraft={(text) => {
            setComposerText(text)
            onDismissAI(conversation.id)
            setTimeout(() => composerRef.current?.focus(), 50)
          }}
        />
      )}

      {/* Reply Composer — always visible */}
      <ReplyComposerControlled
        businessName={businessName}
        value={composerText}
        onChange={setComposerText}
        composerRef={composerRef}
        onSend={(text, files) => {
          onSendReply(conversation.id, text, files)
          setComposerText('')
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Controlled reply composer (receives value from parent for AI draft fill)
// ---------------------------------------------------------------------------
function ReplyComposerControlled({
  businessName,
  value,
  onChange,
  composerRef,
  onSend,
}: {
  businessName: string
  value: string
  onChange: (v: string) => void
  composerRef: React.RefObject<HTMLTextAreaElement | null>
  onSend: (text: string, files?: File[]) => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<File[]>([])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  // Merge external ref
  useEffect(() => {
    if (composerRef && 'current' in composerRef) {
      (composerRef as React.RefObject<HTMLTextAreaElement | null> & { current: HTMLTextAreaElement | null }).current = textareaRef.current
    }
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setAttachments((prev) => [...prev, ...files])
    e.target.value = ''
  }

  function removeAttachment(idx: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleSend() {
    if (!value.trim() && attachments.length === 0) return
    onSend(value, attachments.length > 0 ? attachments : undefined)
    setAttachments([])
  }

  return (
    <div style={{ flexShrink: 0, borderTop: '1px solid #E8E8E2', background: '#FFFFFF', padding: '12px 16px' }}>
      <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '0 0 8px 0', fontWeight: 500 }}>
        Replying as <strong style={{ color: '#6B6B6B' }}>{businessName}</strong> · via Gmail
      </p>

      <textarea
        ref={textareaRef}
        id="reply-composer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write a reply…"
        rows={3}
        style={{
          width: '100%', resize: 'none',
          border: '1px solid #E8E8E2', borderRadius: '8px',
          padding: '10px 12px', fontSize: '13px', color: '#1A1A1A',
          background: '#F9F9F6', outline: 'none', lineHeight: 1.6,
          fontFamily: 'var(--font-dm-sans), sans-serif',
          boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; e.currentTarget.style.background = '#FFFFFF' }}
        onBlur={(e) => { e.currentTarget.style.borderColor = '#E8E8E2'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#F9F9F6' }}
        onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { handleSend() } }}
      />

      {/* Attachment chips */}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
          {attachments.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#EEF3FE', borderRadius: '6px', padding: '3px 8px', fontSize: '12px', color: '#2563EB' }}>
              <Paperclip size={11} />
              <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
              <button onClick={() => removeAttachment(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 2px', lineHeight: 1, color: '#2563EB', display: 'flex' }}>
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#BBBBBB' }}>⌘ + Enter to send</span>
          <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileChange} />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach files"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: '1px solid #E8E8E2', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#6B6B6B', fontSize: '12px', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            <Paperclip size={12} /> Attach
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => { onChange(''); setAttachments([]) }}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', background: 'transparent', color: '#6B6B6B', border: '1px solid #E8E8E2', borderRadius: '7px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            <Trash2 size={12} /> Discard
          </button>
          <button
            onClick={handleSend}
            disabled={!value.trim() && attachments.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: (value.trim() || attachments.length > 0) ? '#2563EB' : '#E8E8E2', color: (value.trim() || attachments.length > 0) ? '#FFFFFF' : '#9CA3AF', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 600, cursor: (value.trim() || attachments.length > 0) ? 'pointer' : 'default', fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'background 0.15s' }}
          >
            <Send size={13} /> Send via Gmail
          </button>
        </div>
      </div>
    </div>
  )
}
