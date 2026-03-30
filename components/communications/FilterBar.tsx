'use client'

import React from 'react'
import { Search, PenSquare, Zap } from 'lucide-react'
import type { ConversationChannel, ConversationStatus } from './mock-data'

const CHANNELS: { id: string; label: string; soon?: boolean }[] = [
  { id: 'all', label: 'All' },
  { id: 'gmail', label: 'Gmail' },
  { id: 'instagram', label: 'Instagram', soon: true },
  { id: 'facebook', label: 'Facebook', soon: true },
]

const STATUSES: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'read', label: 'Read' },
  { id: 'replied', label: 'Replied' },
  { id: 'pending', label: 'Pending' },
]

interface FilterBarProps {
  activeChannel: string
  setActiveChannel: (c: string) => void
  activeStatus: string
  setActiveStatus: (s: string) => void
  priorityOnly: boolean
  setPriorityOnly: (p: boolean) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  onCompose: () => void
}

export function FilterBar({
  activeChannel, setActiveChannel,
  activeStatus, setActiveStatus,
  priorityOnly, setPriorityOnly,
  searchQuery, setSearchQuery,
  onCompose,
}: FilterBarProps) {
  return (
    <div
      style={{
        height: '56px',
        minHeight: '56px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: '6px',
        flexShrink: 0,
        overflowX: 'auto',
      }}
    >
      {/* Channel tabs */}
      {CHANNELS.map((ch) => (
        <button
          key={ch.id}
          disabled={ch.soon}
          onClick={() => !ch.soon && setActiveChannel(ch.id)}
          style={{
            padding: '5px 11px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: activeChannel === ch.id ? 600 : 400,
            color: ch.soon
              ? 'var(--text-disabled)'
              : activeChannel === ch.id
              ? 'var(--accent)'
              : 'var(--text-muted)',
            background: activeChannel === ch.id ? 'var(--accent-light)' : 'transparent',
            border: 'none',
            cursor: ch.soon ? 'default' : 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.1s',
            flexShrink: 0,
            fontFamily: 'var(--font-dm-sans), sans-serif',
          }}
        >
          {ch.label}
          {ch.soon && <span style={{ fontSize: '10px', marginLeft: '3px' }}>(soon)</span>}
        </button>
      ))}

      {/* Divider */}
      <div style={{ width: '1px', height: '20px', background: 'var(--border-default)', margin: '0 4px', flexShrink: 0 }} />

      {/* Status pills */}
      {STATUSES.map((s) => (
        <button
          key={s.id}
          onClick={() => setActiveStatus(s.id)}
          style={{
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: activeStatus === s.id ? 600 : 400,
            color: activeStatus === s.id ? 'var(--accent)' : 'var(--text-muted)',
            background: activeStatus === s.id ? 'var(--accent-light)' : 'transparent',
            border: activeStatus === s.id ? '1px solid var(--accent-light)' : '1px solid transparent',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.1s',
            flexShrink: 0,
            fontFamily: 'var(--font-dm-sans), sans-serif',
          }}
        >
          {s.label}
        </button>
      ))}

      {/* Divider */}
      <div style={{ width: '1px', height: '20px', background: 'var(--border-default)', margin: '0 4px', flexShrink: 0 }} />

      {/* Priority toggle */}
      <button
        onClick={() => setPriorityOnly(!priorityOnly)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: priorityOnly ? 600 : 400,
          color: priorityOnly ? '#D97706' : 'var(--text-muted)',
          background: priorityOnly ? '#FFFBEB' : 'transparent',
          border: priorityOnly ? '1px solid #FDE68A' : '1px solid transparent',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.1s',
          flexShrink: 0,
          fontFamily: 'var(--font-dm-sans), sans-serif',
        }}
      >
        <Zap size={12} />
        Priority
      </button>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Search */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Search
          size={13}
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '220px',
            padding: '7px 12px 7px 30px',
            border: '1px solid var(--border-default)',
            borderRadius: '8px',
            fontSize: '13px',
            background: 'var(--bg-base)',
            color: 'var(--text-primary)',
            outline: 'none',
            fontFamily: 'var(--font-dm-sans), sans-serif',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-light)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = 'none' }}
        />
      </div>

      {/* Compose */}
      <button
        id="compose-btn"
        onClick={onCompose}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 14px',
          background: 'var(--accent)',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          transition: 'background 0.15s',
          fontFamily: 'var(--font-dm-sans), sans-serif',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)' }}
      >
        <PenSquare size={13} />
        Compose
      </button>
    </div>
  )
}
