'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { PenSquare, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useDashboard } from '@/components/layout/DashboardContext'
import { ComposeModal } from '@/components/communications/ComposeModal'
import InvoiceModal from '@/components/finance/InvoiceModal'
import type { InvoicePayload } from '@/components/finance/InvoiceModal'

export function QuickActions() {
  const t = useTranslations('overview')
  const [composeOpen, setComposeOpen] = useState(false)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [countryCode, setCountryCode] = useState('DE')
  const [vatRate, setVatRate] = useState<number | null>(null)
  const { user, business } = useDashboard()

  // Use business from context — already loaded by DashboardProvider
  useEffect(() => {
    if (business?.country_code) setCountryCode(business.country_code)
  }, [business?.country_code])

  async function handleCreateInvoice(payload: InvoicePayload) {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser || !business) return
    const { error } = await supabase.from('invoices').insert({
      ...payload,
      business_id: business.id,
      created_by: authUser.id,
      issued_date: new Date().toISOString().split('T')[0],
      status: 'unpaid',
    })
    if (error) throw error
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setComposeOpen(true)}
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
          onClick={() => setInvoiceOpen(true)}
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

      {/* Compose email modal — same component used on /communications */}
      {composeOpen && (
        <ComposeModal
          onClose={() => setComposeOpen(false)}
          onSent={() => setComposeOpen(false)}
        />
      )}

      {/* Create invoice modal — same component used on /finance */}
      <InvoiceModal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        onSave={handleCreateInvoice}
        countryCode={countryCode}
        businessVatRate={vatRate}
      />
    </>
  )
}
