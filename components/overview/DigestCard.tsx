'use client'

import { useEffect, useState, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { AIBadge } from '@/components/layout/AIBadge'
import { useDashboard } from '@/components/layout/DashboardContext'

export function DigestCard() {
  const t = useTranslations('overview')
  const locale = useLocale()
  const supabase = createClient()
  const { user } = useDashboard()
  const businessId = user.active_business_id ?? user.business_id

  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)

  // Track the locale that the stored digest was generated in
  const digestLocaleRef = useRef<string | null>(null)

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const todayStr = new Date().toISOString().split('T')[0]

  async function loadDigest() {
    const { data } = await supabase
      .from('ai_digests')
      .select('content, locale')
      .eq('business_id', businessId)
      .eq('date', todayStr)
      .maybeSingle()

    if (data?.content) {
      setContent(data.content)
      digestLocaleRef.current = (data as { content: string; locale?: string | null }).locale ?? locale
    } else {
      setContent(null)
      digestLocaleRef.current = null
    }
    setLoading(false)
  }

  async function handleRegenerate(forceLocale?: string) {
    setRegenerating(true)
    const res = await fetch('/api/mistral/digest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: forceLocale ?? locale }),
    })
    const data = await res.json()
    if (data.content) {
      setContent(data.content)
      digestLocaleRef.current = forceLocale ?? locale
    }
    setRegenerating(false)
  }

  // Initial load
  useEffect(() => {
    loadDigest()
  }, [businessId])

  // Realtime: update when digest is regenerated (e.g. from cron or another tab)
  useEffect(() => {
    const channel = supabase
      .channel(`digest:${businessId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_digests',
        filter: `business_id=eq.${businessId}`,
      }, (payload) => {
        setContent((payload.new as { content: string }).content)
        digestLocaleRef.current = (payload.new as { content: string; locale?: string }).locale ?? locale
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'ai_digests',
        filter: `business_id=eq.${businessId}`,
      }, (payload) => {
        setContent((payload.new as { content: string }).content)
        digestLocaleRef.current = (payload.new as { content: string; locale?: string }).locale ?? locale
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [businessId])

  // Auto-regenerate when the UI language changes and a digest already exists
  // (or was just generated) but in a different language
  const prevLocaleRef = useRef(locale)
  useEffect(() => {
    if (prevLocaleRef.current === locale) return
    prevLocaleRef.current = locale

    // Only auto-regenerate if we already have a digest (don't spam on first load)
    if (content !== null && digestLocaleRef.current !== locale) {
      handleRegenerate(locale)
    }
  }, [locale])

  return (
    <div style={{ background: 'var(--dark-card)', borderRadius: '12px', padding: '24px', marginBottom: '0' }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dark-card-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ✦ AI DIGEST — {today.toUpperCase()}
          </span>
          <AIBadge />
        </div>
        <button
          onClick={() => handleRegenerate()}
          disabled={regenerating}
          style={{
            background: 'var(--dark-card-surface)',
            border: '1px solid #3A3A3A',
            borderRadius: '8px',
            padding: '6px 14px',
            color: regenerating ? '#555' : 'var(--dark-card-muted)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: regenerating ? 'not-allowed' : 'pointer',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { if (!regenerating) e.currentTarget.style.color = 'var(--dark-card-text)' }}
          onMouseLeave={(e) => { if (!regenerating) e.currentTarget.style.color = 'var(--dark-card-muted)' }}
        >
          {regenerating ? t('digestRegenerating') : t('digestRegenerate')}
        </button>
      </div>

      {/* Body */}
      <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--dark-card-text)', maxWidth: '580px', margin: '0 0 20px 0', whiteSpace: 'pre-wrap' }}>
        {loading ? (
          <span style={{ color: '#555', fontSize: '13px' }}>{t('digestLoading')}</span>
        ) : content ? (
          content
        ) : (
          <span style={{ color: '#666', fontSize: '13px' }}>
            {t('digestNoContent')}{' '}
            <button
              onClick={() => handleRegenerate()}
              style={{ background: 'none', border: 'none', color: '#6366F1', cursor: 'pointer', fontSize: '13px', padding: 0, textDecoration: 'underline' }}
            >
              {t('digestGenerate')}
            </button>
          </span>
        )}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-6" style={{ borderTop: '1px solid #2A2A2A', paddingTop: '16px' }}>
        <span style={{ fontSize: '12px', color: 'var(--dark-card-subtle)' }}>
          <span style={{ color: 'var(--gmail)', fontWeight: 600 }}>●</span>{' '}
          Gmail <span style={{ color: 'var(--dark-card-muted)' }}>sync active</span>
        </span>
        <span style={{ fontSize: '12px', color: 'var(--dark-card-subtle)' }}>
          <span style={{ color: '#6366F1', fontWeight: 600 }}>✦</span>{' '}
          <span style={{ color: 'var(--dark-card-muted)' }}>Mistral AI</span>
        </span>
      </div>
    </div>
  )
}
