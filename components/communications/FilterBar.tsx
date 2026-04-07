'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Search, PenSquare, Zap, RefreshCw, Tag, ChevronDown, Check } from 'lucide-react'

const LABEL_OPTIONS = ['Priority', 'Urgent', 'Invoice', 'Support', 'Legal', 'Mine']

interface FilterBarProps {
  activeChannel: string
  setActiveChannel: (c: string) => void
  activeStatus: string
  setActiveStatus: (s: string) => void
  activeFolder: string
  setActiveFolder: (f: string) => void
  activeLabel: string
  setActiveLabel: (l: string) => void
  priorityOnly: boolean
  setPriorityOnly: (p: boolean) => void
  mineOnly: boolean
  setMineOnly: (m: boolean) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  onCompose: () => void
  onSync?: () => Promise<void>
  syncing?: boolean
}

export function FilterBar({
  activeChannel, setActiveChannel,
  activeStatus, setActiveStatus,
  activeFolder, setActiveFolder,
  activeLabel, setActiveLabel,
  priorityOnly, setPriorityOnly,
  mineOnly, setMineOnly,
  searchQuery, setSearchQuery,
  onCompose,
  onSync,
  syncing,
}: FilterBarProps) {
  const t = useTranslations('communications')
  const tc = useTranslations('common')
  const [labelOpen, setLabelOpen] = useState(false)
  const labelRef = useRef<HTMLDivElement>(null)

  // Close label dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (labelRef.current && !labelRef.current.contains(e.target as Node)) {
        setLabelOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const CHANNELS = [
    { id: 'all', label: t('filterAll') },
    { id: 'gmail', label: 'Gmail' },
    { id: 'instagram', label: 'Instagram', soon: true },
    { id: 'facebook', label: 'Facebook', soon: true },
  ]

  const STATUSES = [
    { id: 'all', label: t('filterAll') },
    { id: 'unread', label: t('filterUnread') },
    { id: 'read', label: t('markRead') },
    { id: 'replied', label: t('reply') },
  ]

  const FOLDERS = [
    { id: 'inbox', label: 'Inbox' },
    { id: 'archive', label: 'Archive' },
    { id: 'later', label: 'Later' },
    { id: 'follow-up', label: 'Follow-up' },
  ]

  const pill = (active: boolean, color?: 'amber' | 'blue') => ({
    padding: '4px 11px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: active ? 700 : 500,
    color: active ? (color === 'amber' ? '#B45309' : '#2563EB') : '#374151',
    background: active ? (color === 'amber' ? '#FEF3C7' : '#EEF3FE') : '#F3F4F6',
    border: active ? `1px solid ${color === 'amber' ? '#FDE68A' : '#BFDBFE'}` : '1px solid transparent',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.12s',
    flexShrink: 0,
    fontFamily: 'var(--font-dm-sans), sans-serif',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  })

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
        overflow: 'hidden', // no overall scroll
      }}
    >
      {/* ── LEFT: Channel tabs (fixed, never scroll) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
        {CHANNELS.map((ch) => {
          const isActive = activeChannel === ch.id
          return (
            <button
              key={ch.id}
              disabled={ch.soon}
              onClick={() => !ch.soon && setActiveChannel(ch.id)}
              style={{
                padding: '5px 10px',
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
            >
              {ch.label}
              {ch.soon && <span style={{ fontSize: '10px', marginLeft: '3px', color: '#BBBBBB' }}>({tc('soon')})</span>}
            </button>
          )
        })}
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '20px', background: '#E8E8E2', margin: '0 6px', flexShrink: 0 }} />

      {/* ── MIDDLE: Scrollable filter pills ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          flex: 1,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="hide-scrollbar"
      >
        {/* Status pills */}
        {STATUSES.map((s) => {
          const isActive = activeStatus === s.id
          return (
            <button key={s.id} onClick={() => setActiveStatus(s.id)} style={pill(isActive)}>
              {s.label}
            </button>
          )
        })}

        {/* Divider */}
        <div style={{ width: '1px', height: '16px', background: '#E8E8E2', margin: '0 4px', flexShrink: 0 }} />

        {/* Folder pills */}
        {FOLDERS.map((f) => {
          const isActive = activeFolder === f.id
          return (
            <button key={f.id} onClick={() => setActiveFolder(f.id)} style={pill(isActive)}>
              {f.label}
            </button>
          )
        })}

        {/* Divider */}
        <div style={{ width: '1px', height: '16px', background: '#E8E8E2', margin: '0 4px', flexShrink: 0 }} />

        {/* Priority toggle */}
        <button onClick={() => setPriorityOnly(!priorityOnly)} style={pill(priorityOnly, 'amber')}>
          <Zap size={11} />
          {t('filterPriority')}
        </button>

        {/* Mine toggle */}
        <button onClick={() => setMineOnly(!mineOnly)} style={pill(mineOnly)}>
          👤 {t('filterMine')}
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '16px', background: '#E8E8E2', margin: '0 4px', flexShrink: 0 }} />

        {/* Label dropdown */}
        <div ref={labelRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setLabelOpen(!labelOpen)}
            style={{
              ...pill(!!activeLabel),
              gap: '5px',
            }}
          >
            <Tag size={11} />
            {activeLabel || 'Label'}
            <ChevronDown size={10} style={{ marginLeft: '1px', opacity: 0.6 }} />
          </button>
          {labelOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: '4px',
              background: '#FFF', border: '1px solid #E8E8E2', borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, minWidth: '140px', overflow: 'hidden',
            }}>
              {activeLabel && (
                <button
                  onClick={() => { setActiveLabel(''); setLabelOpen(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 14px', textAlign: 'left', background: '#FFF', color: '#6B6B6B', fontSize: '13px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
                >
                  Clear filter
                </button>
              )}
              {LABEL_OPTIONS.map((label) => (
                <button
                  key={label}
                  onClick={() => { setActiveLabel(label === activeLabel ? '' : label); setLabelOpen(false) }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 14px', textAlign: 'left', background: activeLabel === label ? '#EEF3FE' : '#FFF', color: activeLabel === label ? '#2563EB' : '#1A1A1A', fontSize: '13px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: activeLabel === label ? 600 : 400 }}
                >
                  {label}
                  {activeLabel === label && <Check size={12} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Search + Sync + Compose (always visible) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder={tc('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '180px',
              padding: '6px 10px 6px 28px',
              border: '1px solid #E8E8E2',
              borderRadius: '8px',
              fontSize: '13px',
              background: '#F9F9F6',
              color: '#1A1A1A',
              outline: 'none',
              fontFamily: 'var(--font-dm-sans), sans-serif',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#E8E8E2'; e.currentTarget.style.boxShadow = 'none' }}
          />
        </div>

        {/* Sync */}
        {onSync && (
          <button
            onClick={onSync}
            disabled={syncing}
            title="Sync inbox"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'transparent', border: '1px solid #E8E8E2', borderRadius: '8px', cursor: syncing ? 'not-allowed' : 'pointer', color: '#6B6B6B', transition: 'background 0.12s' }}
            onMouseEnter={(e) => { if (!syncing) e.currentTarget.style.background = '#F3F4F6' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        )}

        {/* Compose */}
        <button
          onClick={onCompose}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.15s', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1D4ED8' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#2563EB' }}
        >
          <PenSquare size={13} />
          {t('compose')}
        </button>
      </div>
    </div>
  )
}
