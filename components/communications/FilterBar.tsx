'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Search, PenSquare, Zap, RefreshCw, Tag, ChevronDown, Check, User } from 'lucide-react'

const LABEL_OPTIONS = ['Priority', 'Urgent', 'Invoice', 'Support', 'Legal', 'Mine'] as const
const LABEL_KEYS = ['labelPriority', 'labelUrgent', 'labelInvoice', 'labelSupport', 'labelLegal', 'labelMine'] as const

interface FilterBarProps {
  activeChannel: string
  setActiveChannel: (c: string) => void
  activeStatus: string
  setActiveStatus: (s: string) => void
  activeFolder: string
  setActiveFolder: (f: string) => void
  activeLabel: string
  setActiveLabel: (l: string) => void
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
  searchQuery, setSearchQuery,
  onCompose,
  onSync,
  syncing,
}: FilterBarProps) {
  const t = useTranslations('communications')
  const tc = useTranslations('common')

  const [filterOpen, setFilterOpen] = useState(false)
  const [dropPos, setDropPos] = useState<{ top: number; right: number } | null>(null)
  const filterBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!filterOpen) return
    function handler(e: MouseEvent) {
      const portal = document.getElementById('filter-dropdown-portal')
      if (portal && portal.contains(e.target as Node)) return
      if (filterBtnRef.current && filterBtnRef.current.contains(e.target as Node)) return
      setFilterOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [filterOpen])

  function openFilter() {
    if (filterOpen) { setFilterOpen(false); return }
    if (filterBtnRef.current) {
      const rect = filterBtnRef.current.getBoundingClientRect()
      setDropPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setFilterOpen(true)
  }

  function clearFilter() {
    setActiveLabel('')
    setFilterOpen(false)
  }

  const hasFilter = !!activeLabel
  // Display label on the button — translate if it's a known label
  const labelIdx = LABEL_OPTIONS.indexOf(activeLabel as typeof LABEL_OPTIONS[number])
  const filterLabel = hasFilter
    ? (labelIdx >= 0 ? t(LABEL_KEYS[labelIdx]) : activeLabel)
    : t('label')

  const CHANNELS = [
    { id: 'all', label: t('filterAll') },
    { id: 'gmail', label: 'Gmail' },
    { id: 'instagram', label: 'Instagram', soon: true },
    { id: 'facebook', label: 'Facebook', soon: true },
  ]

  const STATUSES = [
    { id: 'all', label: t('filterAll') },
    { id: 'unread', label: t('filterUnread') },
    { id: 'replied', label: t('filterReplied') },
  ]

  const FOLDERS = [
    { id: 'inbox', label: t('inbox') },
    { id: 'archive', label: t('archive') },
    { id: 'later', label: t('folderLater') },
    { id: 'follow-up', label: t('folderFollowUp') },
  ]

  const pill = (active: boolean) => ({
    padding: '4px 11px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: active ? 700 : 500,
    color: active ? '#2563EB' : '#374151',
    background: active ? '#EEF3FE' : '#F3F4F6',
    border: active ? '1px solid #BFDBFE' : '1px solid transparent',
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
    <>
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
          overflow: 'hidden',
        }}
      >
        {/* ── LEFT: Channel tabs (fixed) ── */}
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
          {/* Status pills: All | Unread | Replied */}
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
        </div>

        {/* ── RIGHT: Label filter + Search + Sync + Compose ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
          {/* Combined Label/Priority/Mine filter button */}
          <button
            ref={filterBtnRef}
            onClick={openFilter}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: hasFilter ? 700 : 500,
              color: hasFilter ? '#2563EB' : '#374151',
              background: hasFilter ? '#EEF3FE' : '#F3F4F6',
              border: hasFilter ? '1px solid #BFDBFE' : '1px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.12s',
              fontFamily: 'var(--font-dm-sans), sans-serif',
            }}
          >
            <Tag size={11} />
            {filterLabel}
            <ChevronDown size={10} style={{ opacity: 0.6, transform: filterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>

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

      {/* Label/filter dropdown — fixed position to escape overflow clipping */}
      {filterOpen && dropPos && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setFilterOpen(false)} />
          <div
            id="filter-dropdown-portal"
            style={{
              position: 'fixed',
              top: dropPos.top,
              right: dropPos.right,
              background: '#FFF',
              border: '1px solid #E8E8E2',
              borderRadius: '12px',
              boxShadow: '0 8px 28px rgba(0,0,0,0.13)',
              zIndex: 200,
              minWidth: '180px',
              overflow: 'hidden',
            }}
          >
            {/* Priority — filters by label 'Priority' */}
            <button
              onClick={() => { setActiveLabel(activeLabel === 'Priority' ? '' : 'Priority'); setFilterOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 14px', textAlign: 'left', background: activeLabel === 'Priority' ? '#FFFBEB' : '#FFF', color: activeLabel === 'Priority' ? '#B45309' : '#1A1A1A', fontSize: '13px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: activeLabel === 'Priority' ? 600 : 400 }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={13} color={activeLabel === 'Priority' ? '#B45309' : '#6B7280'} />
                {t('labelPriority')}
              </span>
              {activeLabel === 'Priority' && <Check size={12} />}
            </button>

            {/* Mine — filters by label 'Mine' */}
            <button
              onClick={() => { setActiveLabel(activeLabel === 'Mine' ? '' : 'Mine'); setFilterOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 14px', textAlign: 'left', background: activeLabel === 'Mine' ? '#EEF3FE' : '#FFF', color: activeLabel === 'Mine' ? '#2563EB' : '#1A1A1A', fontSize: '13px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: activeLabel === 'Mine' ? 600 : 400 }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={13} color={activeLabel === 'Mine' ? '#2563EB' : '#6B7280'} />
                {t('labelMine')}
              </span>
              {activeLabel === 'Mine' && <Check size={12} />}
            </button>

            {/* Separator */}
            <div style={{ height: '1px', background: '#E8E8E2', margin: '2px 0' }} />

            {/* Remaining label options (skip Priority and Mine — already shown above) */}
            {LABEL_OPTIONS.filter((l) => l !== 'Priority' && l !== 'Mine').map((label) => {
              const idx = LABEL_OPTIONS.indexOf(label)
              const active = activeLabel === label
              return (
                <button
                  key={label}
                  onClick={() => { setActiveLabel(active ? '' : label); setFilterOpen(false) }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 14px', textAlign: 'left', background: active ? '#EEF3FE' : '#FFF', color: active ? '#2563EB' : '#1A1A1A', fontSize: '13px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: active ? 600 : 400 }}
                >
                  {t(LABEL_KEYS[idx])}
                  {active && <Check size={12} />}
                </button>
              )
            })}

            {/* Clear — only when a filter is active */}
            {hasFilter && (
              <>
                <div style={{ height: '1px', background: '#E8E8E2', margin: '2px 0' }} />
                <button
                  onClick={clearFilter}
                  style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '9px 14px', background: '#FFF', color: '#9CA3AF', fontSize: '12px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
                >
                  {tc('remove')} filter
                </button>
              </>
            )}
          </div>
        </>
      )}
    </>
  )
}
