'use client'

import React from 'react'
import { Search, PenSquare, Zap } from 'lucide-react'

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
  mineOnly: boolean
  setMineOnly: (m: boolean) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  onCompose: () => void
}

export function FilterBar({
  activeChannel, setActiveChannel,
  activeStatus, setActiveStatus,
  priorityOnly, setPriorityOnly,
  mineOnly, setMineOnly,
  searchQuery, setSearchQuery,
  onCompose,
}: FilterBarProps) {
  return (
    <div
      style={{
        height: '56px',
        minHeight: '56px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E8E8E2',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: '4px',
        flexShrink: 0,
        overflowX: 'auto',
      }}
    >
      {/* ── Channel tabs ── */}
      {CHANNELS.map((ch) => {
        const isActive = activeChannel === ch.id
        return (
          <button
            key={ch.id}
            disabled={ch.soon}
            onClick={() => !ch.soon && setActiveChannel(ch.id)}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: isActive ? 700 : 500,
              color: ch.soon ? '#BBBBBB' : isActive ? '#2563EB' : '#374151',
              background: isActive ? '#EEF3FE' : 'transparent',
              border: isActive ? '1px solid #BFDBFE' : '1px solid transparent',
              cursor: ch.soon ? 'default' : 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.12s',
              flexShrink: 0,
              fontFamily: 'var(--font-dm-sans), sans-serif',
            }}
            onMouseEnter={(e) => {
              if (!ch.soon && !isActive) e.currentTarget.style.background = '#F3F4F6'
            }}
            onMouseLeave={(e) => {
              if (!ch.soon && !isActive) e.currentTarget.style.background = 'transparent'
            }}
          >
            {ch.label}
            {ch.soon && <span style={{ fontSize: '10px', marginLeft: '3px', color: '#BBBBBB' }}>(soon)</span>}
          </button>
        )
      })}

      {/* Divider */}
      <div style={{ width: '1px', height: '20px', background: '#E8E8E2', margin: '0 6px', flexShrink: 0 }} />

      {/* ── Status pills ── */}
      {STATUSES.map((s) => {
        const isActive = activeStatus === s.id
        return (
          <button
            key={s.id}
            onClick={() => setActiveStatus(s.id)}
            style={{
              padding: '4px 11px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#2563EB' : '#374151',
              background: isActive ? '#EEF3FE' : '#F3F4F6',
              border: isActive ? '1px solid #BFDBFE' : '1px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.12s',
              flexShrink: 0,
              fontFamily: 'var(--font-dm-sans), sans-serif',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.background = '#E5E7EB'
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = '#F3F4F6'
            }}
          >
            {s.label}
          </button>
        )
      })}

      {/* Divider */}
      <div style={{ width: '1px', height: '20px', background: '#E8E8E2', margin: '0 6px', flexShrink: 0 }} />

      {/* ── Priority toggle ── */}
      <button
        onClick={() => setPriorityOnly(!priorityOnly)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 11px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: priorityOnly ? 700 : 500,
          color: priorityOnly ? '#B45309' : '#374151',
          background: priorityOnly ? '#FEF3C7' : '#F3F4F6',
          border: priorityOnly ? '1px solid #FDE68A' : '1px solid transparent',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.12s',
          flexShrink: 0,
          fontFamily: 'var(--font-dm-sans), sans-serif',
        }}
        onMouseEnter={(e) => {
          if (!priorityOnly) e.currentTarget.style.background = '#E5E7EB'
        }}
        onMouseLeave={(e) => {
          if (!priorityOnly) e.currentTarget.style.background = '#F3F4F6'
        }}
      >
        <Zap size={12} />
        Priority
      </button>

      {/* ── Mine toggle ── */}
      <button
        onClick={() => setMineOnly(!mineOnly)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 11px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: mineOnly ? 700 : 500,
          color: mineOnly ? '#2563EB' : '#374151',
          background: mineOnly ? '#EEF3FE' : '#F3F4F6',
          border: mineOnly ? '1px solid #BFDBFE' : '1px solid transparent',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.12s',
          flexShrink: 0,
          fontFamily: 'var(--font-dm-sans), sans-serif',
        }}
        onMouseEnter={(e) => {
          if (!mineOnly) e.currentTarget.style.background = '#E5E7EB'
        }}
        onMouseLeave={(e) => {
          if (!mineOnly) e.currentTarget.style.background = '#F3F4F6'
        }}
      >
        👤 Mine
      </button>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* ── Search ── */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Search
          size={13}
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9CA3AF',
            pointerEvents: 'none',
          }}
        />
        <input
          id="comms-search"
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '220px',
            padding: '7px 12px 7px 30px',
            border: '1px solid #E8E8E2',
            borderRadius: '8px',
            fontSize: '13px',
            background: '#F9F9F6',
            color: '#1A1A1A',
            outline: 'none',
            fontFamily: 'var(--font-dm-sans), sans-serif',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#2563EB'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#E8E8E2'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
      </div>

      {/* ── Compose ── */}
      <button
        id="compose-btn"
        onClick={onCompose}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 16px',
          background: '#2563EB',
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
          letterSpacing: '0.01em',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#1D4ED8' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#2563EB' }}
      >
        <PenSquare size={13} />
        Compose
      </button>
    </div>
  )
}
