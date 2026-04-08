'use client'

import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useTranslations } from 'next-intl'
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
  FileText,
  Download,
  Archive,
  FolderInput,
  Check,
} from 'lucide-react'
import type { Conversation, ConversationChannel, MessageAttachment, ThreadMessage } from './mock-data'

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

// ---------------------------------------------------------------------------
// Skeleton components
// ---------------------------------------------------------------------------

function SkeletonBlock({ width, height, radius = 6, style }: { width: string | number; height: string | number; radius?: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'linear-gradient(90deg, #F0F0EE 25%, #E8E8E5 50%, #F0F0EE 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      flexShrink: 0,
      ...style,
    }} />
  )
}

function ThreadSkeleton() {
  return (
    <>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      {/* Inbound bubble */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '16px', paddingRight: '60px' }}>
        <SkeletonBlock width={28} height={28} radius={14} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxWidth: '60%' }}>
          <SkeletonBlock width={80} height={10} />
          <SkeletonBlock width={220} height={52} radius={12} />
          <SkeletonBlock width={50} height={8} />
        </div>
      </div>
      {/* Outbound bubble */}
      <div style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'flex-end', gap: '8px', marginBottom: '16px', paddingLeft: '60px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', maxWidth: '55%' }}>
          <SkeletonBlock width={160} height={40} radius={12} />
          <SkeletonBlock width={50} height={8} />
        </div>
      </div>
      {/* Inbound bubble 2 */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '16px', paddingRight: '60px' }}>
        <SkeletonBlock width={28} height={28} radius={14} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxWidth: '65%' }}>
          <SkeletonBlock width={80} height={10} />
          <SkeletonBlock width={280} height={72} radius={12} />
          <SkeletonBlock width={50} height={8} />
        </div>
      </div>
      {/* Outbound bubble 2 */}
      <div style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'flex-end', gap: '8px', marginBottom: '16px', paddingLeft: '60px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', maxWidth: '50%' }}>
          <SkeletonBlock width={190} height={36} radius={12} />
          <SkeletonBlock width={50} height={8} />
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Image lightbox — fullscreen overlay, closes on backdrop click or Escape
// ---------------------------------------------------------------------------

function ImageLightbox({ src, filename, onClose }: { src: string; filename: string; onClose: () => void }) {
  const t = useTranslations('communications')
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.88)',
        zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Top bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: '52px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>
          {filename}
        </span>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <a
            href={src}
            download={filename}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 12px',
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)',
              borderRadius: '7px', color: '#FFFFFF', fontSize: '12px', fontWeight: 500,
              textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif',
            }}
          >
            <Download size={13} /> {t('download')}
          </a>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '7px', color: '#FFFFFF', cursor: 'pointer',
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Image — click on it does NOT close */}
      <img
        src={src}
        alt={filename}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw', maxHeight: 'calc(90vh - 52px)',
          objectFit: 'contain', borderRadius: '6px',
          userSelect: 'none', display: 'block',
        }}
      />

      <span style={{ position: 'fixed', bottom: '14px', color: 'rgba(255,255,255,0.3)', fontSize: '11px', pointerEvents: 'none' }}>
        {t('escToClose')}
      </span>
    </div>,
    document.body
  )
}

// ---------------------------------------------------------------------------
// Helpers for file chips
// ---------------------------------------------------------------------------

function fileEmoji(mimeType: string, filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (mimeType === 'application/pdf' || ext === 'pdf') return '📄'
  if (mimeType.startsWith('image/')) return '🖼️'
  if (['doc', 'docx'].includes(ext)) return '📝'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊'
  if (['ppt', 'pptx'].includes(ext)) return '📋'
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '🗜️'
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return '🎬'
  if (['mp3', 'wav', 'm4a', 'ogg'].includes(ext)) return '🎵'
  if (['md', 'txt', 'log'].includes(ext)) return '📃'
  return '📎'
}

function attachmentUrl(att: MessageAttachment): string {
  const params = new URLSearchParams({
    gmailMessageId: att.gmailMessageId,
    attachmentId: att.attachmentId,
    mimeType: att.mimeType || 'application/octet-stream',
    filename: att.filename,
  })
  return `/api/gmail/attachment?${params.toString()}`
}

// ---------------------------------------------------------------------------
// Attachment item — free-standing (no bubble wrapper)
// ---------------------------------------------------------------------------

function AttachmentItem({ att, isOut }: { att: MessageAttachment; isOut: boolean }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const isImage = att.mimeType.startsWith('image/') && !imgError
  const url = attachmentUrl(att)

  // --- Inline image ---
  if (isImage) {
    return (
      <>
        <img
          src={url}
          alt={att.filename}
          onClick={() => setLightboxOpen(true)}
          onError={() => setImgError(true)}
          title="Click to enlarge"
          style={{
            maxWidth: '260px', maxHeight: '220px',
            borderRadius: '10px', display: 'block',
            objectFit: 'cover', cursor: 'zoom-in',
            boxShadow: '0 2px 10px rgba(0,0,0,0.14)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.02)'; (e.currentTarget as HTMLImageElement).style.boxShadow = '0 4px 18px rgba(0,0,0,0.22)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLImageElement).style.boxShadow = '0 2px 10px rgba(0,0,0,0.14)' }}
        />
        {lightboxOpen && <ImageLightbox src={url} filename={att.filename} onClose={() => setLightboxOpen(false)} />}
      </>
    )
  }

  // --- File chip with direct download link ---
  return (
    <a
      href={url}
      download={att.filename}
      title={`Download ${att.filename}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '8px 14px',
        borderRadius: '10px',
        background: isOut ? '#EEF3FE' : '#F3F4F6',
        color: isOut ? '#2563EB' : '#374151',
        fontSize: '12px', fontWeight: 500,
        border: `1px solid ${isOut ? '#BFDBFE' : '#E5E7EB'}`,
        textDecoration: 'none',
        fontFamily: 'var(--font-dm-sans), sans-serif',
        maxWidth: '280px',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = isOut ? '#DBEAFE' : '#E9EAEC' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = isOut ? '#EEF3FE' : '#F3F4F6' }}
    >
      <span style={{ fontSize: '16px', lineHeight: 1, flexShrink: 0 }}>{fileEmoji(att.mimeType, att.filename)}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>{att.filename}</span>
      <Download size={11} style={{ flexShrink: 0, opacity: 0.5 }} />
    </a>
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

  const hasBody = msg.body.trim().length > 0
  const hasAttachments = (msg.attachments?.length ?? 0) > 0

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
      {/* Avatar — only for inbound */}
      {!isOut && <Avatar name={msg.senderName} size={28} />}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOut ? 'flex-end' : 'flex-start', gap: '5px', maxWidth: '72%' }}>
        {/* Sender name — only for inbound */}
        {!isOut && (
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', paddingLeft: '4px' }}>
            {msg.senderName}
          </span>
        )}

        {/* Text bubble — only when there is body text */}
        {hasBody && (
          <div style={{ ...bubbleStyle, padding: '9px 13px', fontSize: '13px', lineHeight: 1.55, wordBreak: 'break-word' }}>
            <MessageBody text={msg.body} />
          </div>
        )}

        {/* Attachments — free-standing, never inside a bubble */}
        {hasAttachments && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: isOut ? 'flex-end' : 'flex-start' }}>
            {msg.attachments!.map((att, i) => (
              <AttachmentItem key={i} att={att} isOut={isOut} />
            ))}
          </div>
        )}

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
  const t = useTranslations('communications')
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
            ✦ {t('aiDraft')}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#4338CA' }}>{t('suggestedReply')}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setText(draft)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#6366F1', fontSize: '12px', fontWeight: 500, cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            <RefreshCw size={12} /> {t('regenerate')}
          </button>
          <button
            onClick={onDismiss}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#9CA3AF', fontSize: '12px', fontWeight: 500, cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            <X size={12} /> {t('dismiss')}
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
          {t('useDraft')}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main ThreadView
// ---------------------------------------------------------------------------

const LABEL_KEYS = ['labelPriority', 'labelUrgent', 'labelInvoice', 'labelSupport', 'labelLegal', 'labelMine'] as const
const LABEL_VALUES = ['Priority', 'Urgent', 'Invoice', 'Support', 'Legal', 'Mine'] as const
const LABEL_KEY_MAP: Record<string, string> = {
  Priority: 'labelPriority',
  Urgent: 'labelUrgent',
  Invoice: 'labelInvoice',
  Support: 'labelSupport',
  Legal: 'labelLegal',
  Mine: 'labelMine',
}

interface TeamMember { id: string; fullName: string; email: string }

interface ThreadViewProps {
  conversation: Conversation | null
  showAIPanel: boolean
  priorityOnly: boolean
  businessName: string
  currentUserEmail: string
  currentUserId: string
  teamMembers: TeamMember[]
  messagesLoading: boolean
  onDismissAI: (id: string) => void
  onSendReply: (id: string, text: string, files?: File[]) => void
  onMarkUnread: (id: string) => void
  onAssign: (id: string, memberId: string | null) => void
  onLabel: (id: string, label: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onMoveToFolder: (id: string, folder: string) => void
}

export function ThreadView({ conversation, showAIPanel, priorityOnly, businessName, currentUserEmail, currentUserId, teamMembers, messagesLoading, onDismissAI, onSendReply, onMarkUnread, onAssign, onLabel, onArchive, onDelete, onMoveToFolder }: ThreadViewProps) {
  const t = useTranslations('communications')
  const tc = useTranslations('common')
  const [showAssignDropdown, setShowAssignDropdown] = useState(false)
  const [showLabelDropdown, setShowLabelDropdown] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showFolderMenu, setShowFolderMenu] = useState(false)
  const [composerText, setComposerText] = useState('')

  const assignRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)

  // Close any open dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (assignRef.current && !assignRef.current.contains(e.target as Node)) setShowAssignDropdown(false)
      if (labelRef.current && !labelRef.current.contains(e.target as Node)) setShowLabelDropdown(false)
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) { setShowMoreMenu(false); setShowFolderMenu(false) }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Keep local composer state available for "Use this draft"
  const composerRef = useRef<HTMLTextAreaElement | null>(null)

  // ALL hooks must be called before any early returns (Rules of Hooks).
  // The "other party" in this conversation should never be the logged-in user.
  // If the DB stored the user's own email as participant (a bug in early syncs),
  // fall back to the first inbound message's sender.
  const otherParty = React.useMemo(() => {
    if (!conversation) return { name: '', email: '' }
    if (
      currentUserEmail &&
      conversation.sender.email.toLowerCase() === currentUserEmail.toLowerCase()
    ) {
      const firstInbound = conversation.messages.find((m) => m.direction === 'inbound')
      if (firstInbound) return { name: firstInbound.senderName, email: firstInbound.senderEmail }
    }
    return { name: conversation.sender.name, email: conversation.sender.email }
  }, [conversation, currentUserEmail])

  // Empty: priority filter but no results
  if (!conversation && priorityOnly) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#F9F9F6' }}>
        <span style={{ fontSize: '36px' }}>⚡</span>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>{t('caughtUp')}</p>
        <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>{t('noPriorityMessages')} 🎉</p>
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
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>{t('selectConversation')}</p>
        <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>{t('chooseMessage')}</p>
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
          {/* Assign to */}
          <div ref={assignRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowAssignDropdown(!showAssignDropdown); setShowLabelDropdown(false); setShowMoreMenu(false); setShowFolderMenu(false) }}
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
              {conversation.assignedTo ? conversation.assignedTo : t('assignTo')}
            </button>
            {showAssignDropdown && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: '#FFF', border: '1px solid #E8E8E2', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, minWidth: '180px', overflow: 'hidden' }}>
                {/* Unassigned option */}
                <button
                  onClick={() => { onAssign(conversation.id, null); setShowAssignDropdown(false) }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 14px', textAlign: 'left', background: !conversation.assignedToId ? '#EEF3FE' : '#FFF', color: !conversation.assignedToId ? '#2563EB' : '#6B6B6B', fontSize: '13px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: !conversation.assignedToId ? 600 : 400 }}
                >
                  {t('unassigned')}
                  {!conversation.assignedToId && <Check size={12} />}
                </button>
                {/* Real team members */}
                {teamMembers.map((m) => {
                  const isMe = m.id === currentUserId
                  const label = isMe ? t('youName', { name: m.fullName }) : m.fullName
                  const isSelected = conversation.assignedToId === m.id
                  return (
                    <button key={m.id} onClick={() => { onAssign(conversation.id, m.id); setShowAssignDropdown(false) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 14px', textAlign: 'left', background: isSelected ? '#EEF3FE' : '#FFF', color: isSelected ? '#2563EB' : '#1A1A1A', fontSize: '13px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: isSelected ? 600 : 400 }}>
                      {label}
                      {isSelected && <Check size={12} />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Label */}
          <div ref={labelRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowLabelDropdown(!showLabelDropdown); setShowAssignDropdown(false); setShowMoreMenu(false); setShowFolderMenu(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', border: '1px solid #E8E8E2', borderRadius: '6px', background: conversation.labels?.length ? '#EEF3FE' : '#F9F9F6', fontSize: '12px', color: conversation.labels?.length ? '#2563EB' : '#6B6B6B', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
            >
              <Tag size={13} />
              {conversation.labels?.length ? conversation.labels.map((l) => LABEL_KEY_MAP[l] ? t(LABEL_KEY_MAP[l] as Parameters<typeof t>[0]) : l).join(', ') : t('label')}
            </button>
            {showLabelDropdown && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: '#FFF', border: '1px solid #E8E8E2', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, minWidth: '160px', overflow: 'hidden' }}>
                {LABEL_KEYS.map((key, i) => {
                  const value = LABEL_VALUES[i]
                  const active = conversation.labels?.includes(value)
                  return (
                    <button key={value} onClick={() => { onLabel(conversation.id, value) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 14px', textAlign: 'left', background: active ? '#EEF3FE' : '#FFF', color: active ? '#2563EB' : '#1A1A1A', fontSize: '13px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: active ? 600 : 400 }}>
                      {t(key)}
                      {active && <Check size={12} />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Mark read/unread */}
          <button
            onClick={() => onMarkUnread(conversation.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', border: '1px solid #E8E8E2', borderRadius: '6px', background: '#F9F9F6', fontSize: '12px', color: '#6B6B6B', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            {isUnread ? <MailOpen size={13} /> : <Mail size={13} />}
            {isUnread ? t('read') : t('unread')}
          </button>

          {/* More menu */}
          <div ref={moreRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowMoreMenu(!showMoreMenu); setShowAssignDropdown(false); setShowLabelDropdown(false); setShowFolderMenu(false) }}
              style={{ display: 'flex', alignItems: 'center', padding: '5px 8px', border: '1px solid #E8E8E2', borderRadius: '6px', background: '#F9F9F6', cursor: 'pointer' }}
            >
              <MoreHorizontal size={15} color="#9CA3AF" />
            </button>
            {showMoreMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: '#FFF', border: '1px solid #E8E8E2', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, minWidth: '160px', overflow: 'hidden' }}>
                <button onClick={() => { onArchive(conversation.id); setShowMoreMenu(false) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 14px', textAlign: 'left', background: '#FFF', color: '#1A1A1A', fontSize: '13px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                  <Archive size={13} color="#6B6B6B" /> {t('archive')}
                </button>
                {/* Move to folder — click to toggle inline list */}
                <button
                  onClick={() => setShowFolderMenu(!showFolderMenu)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 14px', textAlign: 'left', background: showFolderMenu ? '#F9F9F6' : '#FFF', color: '#1A1A1A', fontSize: '13px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', justifyContent: 'space-between' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FolderInput size={13} color="#6B6B6B" /> {t('moveToFolder')}</span>
                  <span style={{ fontSize: '10px', color: '#9CA3AF' }}>{showFolderMenu ? '▾' : '▸'}</span>
                </button>
                {showFolderMenu && (
                  <div style={{ background: '#F9F9F6', borderTop: '1px solid #E8E8E2', borderBottom: '1px solid #E8E8E2' }}>
                    {[
                      { value: 'inbox', label: t('folderInbox') },
                      { value: 'later', label: t('folderLater') },
                      { value: 'follow-up', label: t('folderFollowUp') },
                    ].map((f) => (
                      <button key={f.value} onClick={() => { onMoveToFolder(conversation.id, f.value); setShowMoreMenu(false); setShowFolderMenu(false) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 14px 8px 32px', textAlign: 'left', background: conversation.folder === f.value ? '#EEF3FE' : 'transparent', color: conversation.folder === f.value ? '#2563EB' : '#374151', fontSize: '12px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: conversation.folder === f.value ? 600 : 400 }}>
                        {f.label}
                        {conversation.folder === f.value && <Check size={11} />}
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => { if (confirm(t('deleteConfirm'))) { onDelete(conversation.id); setShowMoreMenu(false) } }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 14px', textAlign: 'left', background: '#FFF', color: '#DC2626', fontSize: '13px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                  <Trash2 size={13} /> {tc('delete')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sender info bar — shows the OTHER party, never the logged-in user */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid #E8E8E2', background: '#FAFAFA', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <Avatar name={otherParty.name} size={32} />
        <div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>{otherParty.name}</span>
          {otherParty.email && (
            <span style={{ fontSize: '12px', color: '#9CA3AF', marginLeft: '6px' }}>&lt;{otherParty.email}&gt;</span>
          )}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#9CA3AF' }}>via Gmail · {conversation.timestamp}</span>
      </div>

      {/* Message thread - scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', background: '#F0F4F8' }}>
        {messagesLoading && conversation.messages.length === 0 ? (
          <ThreadSkeleton />
        ) : conversation.messages.length === 0 ? (
          <ThreadSkeleton />
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
  const t = useTranslations('communications')
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
        {t('replyingAsViaGmail', { name: businessName })}
      </p>

      <textarea
        ref={textareaRef}
        id="reply-composer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('typeReply')}
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
          <span style={{ fontSize: '11px', color: '#BBBBBB' }}>{t('cmdEnterToSend')}</span>
          <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileChange} />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach files"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: '1px solid #E8E8E2', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#6B6B6B', fontSize: '12px', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            <Paperclip size={12} /> {t('attach')}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => { onChange(''); setAttachments([]) }}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', background: 'transparent', color: '#6B6B6B', border: '1px solid #E8E8E2', borderRadius: '7px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            <Trash2 size={12} /> {t('discard')}
          </button>
          <button
            onClick={handleSend}
            disabled={!value.trim() && attachments.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: (value.trim() || attachments.length > 0) ? '#2563EB' : '#E8E8E2', color: (value.trim() || attachments.length > 0) ? '#FFFFFF' : '#9CA3AF', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 600, cursor: (value.trim() || attachments.length > 0) ? 'pointer' : 'default', fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'background 0.15s' }}
          >
            <Send size={13} /> {t('sendViaGmail')}
          </button>
        </div>
      </div>
    </div>
  )
}
