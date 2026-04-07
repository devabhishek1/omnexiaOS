'use client'

import React, { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { X, Send, Mail, Paperclip } from 'lucide-react'

interface ComposeModalProps {
  onClose: () => void
  onSent?: () => void
  initialTo?: string
  initialSubject?: string
  initialBody?: string
}

export function ComposeModal({ onClose, onSent, initialTo = '', initialSubject = '', initialBody = '' }: ComposeModalProps) {
  const t = useTranslations('communications')
  const tc = useTranslations('common')
  const [to, setTo] = useState(initialTo)
  const [subject, setSubject] = useState(initialSubject)
  const [body, setBody] = useState(initialBody)
  const [attachments, setAttachments] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setAttachments((prev) => [...prev, ...files])
    e.target.value = ''
  }

  async function handleSend() {
    if (!to || !subject || sending) return
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to.trim())) {
      setError('Please enter a valid email address')
      return
    }
    setSending(true)
    setError(null)
    try {
      let res: Response
      if (attachments.length > 0) {
        const fd = new FormData()
        fd.append('to', to.trim())
        fd.append('subject', subject)
        fd.append('replyBody', body)
        for (const f of attachments) fd.append('attachments', f)
        res = await fetch('/api/gmail/send', { method: 'POST', body: fd })
      } else {
        res = await fetch('/api/gmail/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: to.trim(), subject, replyBody: body }),
        })
      }
      if (res.ok) {
        onSent?.()
        onClose()
      } else {
        const data = await res.json()
        setError(data.error ?? 'Failed to send')
        setSending(false)
      }
    } catch {
      setError('Network error — please try again')
      setSending(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          width: '560px',
          maxWidth: '90vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--gmail-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={14} color="var(--gmail)" />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{t('compose')}</span>
            <span style={{ fontSize: '11px', color: 'var(--gmail)', background: 'var(--gmail-light)', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>Gmail</span>
          </div>
          <button
            id="compose-close-btn"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Fields */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* To */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-default)', paddingBottom: '10px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', width: '60px', flexShrink: 0 }}>{t('to')}</label>
            <input
              id="compose-to"
              type="email"
              placeholder="recipient@company.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                background: 'transparent',
              }}
            />
          </div>

          {/* Subject */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-default)', paddingBottom: '10px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', width: '60px', flexShrink: 0 }}>{t('subject')}</label>
            <input
              id="compose-subject"
              type="text"
              placeholder="Message subject…"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                background: 'transparent',
              }}
            />
          </div>

          {/* Body */}
          <textarea
            id="compose-body"
            placeholder="Write your message…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            style={{
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: '14px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-dm-sans), sans-serif',
              lineHeight: 1.6,
              background: 'transparent',
            }}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid var(--border-default)',
            background: 'var(--bg-base)',
          }}
        >
          {/* Attachment chips */}
          {attachments.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px 20px 0' }}>
              {attachments.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#EEF3FE', borderRadius: '6px', padding: '3px 8px', fontSize: '12px', color: '#2563EB' }}>
                  <Paperclip size={11} />
                  <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  <button onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 2px', lineHeight: 1, color: '#2563EB', display: 'flex' }}>
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {error && (
            <p style={{ margin: 0, padding: '8px 20px 0', fontSize: '12px', color: '#DC2626' }}>{error}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '12px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileChange} />
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Attach files"
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
              >
                <Paperclip size={13} /> {t('attachFile')}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                id="compose-cancel-btn"
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                }}
              >
                {tc('cancel')}
              </button>
              <button
                id="compose-send-btn"
                onClick={handleSend}
                disabled={!to || !subject || sending}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  background: (!to || !subject || sending) ? '#93C5FD' : 'var(--omnexia-accent)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: (!to || !subject || sending) ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  transition: 'background 0.15s',
                }}
              >
                <Send size={13} /> {sending ? tc('sending') : tc('send')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
