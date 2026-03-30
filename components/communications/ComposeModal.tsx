'use client'

import React, { useState } from 'react'
import { X, Send, Mail } from 'lucide-react'

interface ComposeModalProps {
  onClose: () => void
}

export function ComposeModal({ onClose }: ComposeModalProps) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  function handleSend() {
    // Mock send — just close the modal
    onClose()
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
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>New Message</span>
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
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', width: '60px', flexShrink: 0 }}>To</label>
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
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', width: '60px', flexShrink: 0 }}>Subject</label>
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
            padding: '12px 20px',
            borderTop: '1px solid var(--border-default)',
            background: 'var(--bg-base)',
          }}
        >
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
            Cancel
          </button>
          <button
            id="compose-send-btn"
            onClick={handleSend}
            disabled={!to || !subject}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              background: (!to || !subject) ? 'var(--border-strong)' : 'var(--accent)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: (!to || !subject) ? 'not-allowed' : 'pointer',
              opacity: (!to || !subject) ? 0.6 : 1,
              fontFamily: 'var(--font-dm-sans), sans-serif',
              transition: 'background 0.15s',
            }}
          >
            <Send size={13} /> Send
          </button>
        </div>
      </div>
    </div>
  )
}
