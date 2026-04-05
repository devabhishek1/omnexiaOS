'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { AIBadge } from '@/components/layout/AIBadge'

export function DigestCard() {
  const t = useTranslations('overview')
  const supabase = createClient()
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: userRow } = await supabase.from('users').select('business_id').eq('id', user.id).single()
      if (!userRow?.business_id) { setLoading(false); return }
      const businessId = userRow.business_id
      await loadDigest()

      // Subscribe to digest updates (e.g. triggered by language change in Settings)
      channel = supabase
        .channel('digest-realtime')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_digests',
          filter: `business_id=eq.${businessId}`,
        }, (payload) => {
          setContent((payload.new as { content: string }).content)
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_digests',
          filter: `business_id=eq.${businessId}`,
        }, (payload) => {
          setContent((payload.new as { content: string }).content)
        })
        .subscribe()
    }

    init()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  async function loadDigest() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: userRow } = await supabase.from('users').select('business_id').eq('id', user.id).single()
    if (!userRow?.business_id) { setLoading(false); return }

    const todayStr = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('ai_digests')
      .select('content')
      .eq('business_id', userRow.business_id)
      .eq('date', todayStr)
      .maybeSingle()

    setContent(data?.content ?? null)
    setLoading(false)
  }

  async function handleRegenerate() {
    setRegenerating(true)
    const res = await fetch('/api/mistral/digest', { method: 'POST' })
    const data = await res.json()
    if (data.content) setContent(data.content)
    setRegenerating(false)
  }

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
          onClick={handleRegenerate}
          disabled={regenerating}
          style={{ background: 'var(--dark-card-surface)', border: '1px solid #3A3A3A', borderRadius: '8px', padding: '6px 14px', color: regenerating ? '#555' : 'var(--dark-card-muted)', fontSize: '12px', fontWeight: 500, cursor: regenerating ? 'not-allowed' : 'pointer', transition: 'color 0.15s' }}
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
            <button onClick={handleRegenerate} style={{ background: 'none', border: 'none', color: '#6366F1', cursor: 'pointer', fontSize: '13px', padding: 0, textDecoration: 'underline' }}>
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
