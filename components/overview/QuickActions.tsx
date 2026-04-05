'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { PenSquare, FileText } from 'lucide-react'

export function QuickActions() {
  const router = useRouter()
  const t = useTranslations('overview')

  return (
    <div className="flex items-center gap-3">
      <button
        id="quick-compose"
        onClick={() => router.push('/communications?compose=true')}
        className="flex items-center gap-2"
        style={{
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'background 0.15s, border-color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-elevated)'
          e.currentTarget.style.borderColor = 'var(--border-strong)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--bg-surface)'
          e.currentTarget.style.borderColor = 'var(--border-default)'
        }}
      >
        <PenSquare size={14} />
        {t('composeMessage')}
      </button>

      <button
        id="quick-invoice"
        onClick={() => router.push('/finance?create=true')}
        className="flex items-center gap-2"
        style={{
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'background 0.15s, border-color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-elevated)'
          e.currentTarget.style.borderColor = 'var(--border-strong)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--bg-surface)'
          e.currentTarget.style.borderColor = 'var(--border-default)'
        }}
      >
        <FileText size={14} />
        {t('createInvoice')}
      </button>
    </div>
  )
}
