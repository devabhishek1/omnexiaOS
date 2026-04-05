'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { getVatRate, calculateVat } from '@/lib/utils/vat'

interface Invoice { total: number; vat_amount: number | null; subtotal: number | null; status: string; issued_date: string | null }

interface Props {
  invoices: Invoice[]
  countryCode: string
  businessVatRate?: number | null
}

function getCurrentQuarterLabel() {
  const now = new Date()
  const q = Math.ceil((now.getMonth() + 1) / 3)
  return `Q${q} ${now.getFullYear()}`
}

function isCurrentQuarter(dateStr: string | null) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  const dQ = Math.ceil((d.getMonth() + 1) / 3)
  const nowQ = Math.ceil((now.getMonth() + 1) / 3)
  return d.getFullYear() === now.getFullYear() && dQ === nowQ
}

export default function VATPanel({ invoices, countryCode, businessVatRate }: Props) {
  const t = useTranslations('finance')
  const defaultRate = businessVatRate ?? getVatRate(countryCode)
  const [vatRate, setVatRate] = useState(defaultRate)
  const [overriding, setOverriding] = useState(false)

  const quarterInvoices = invoices.filter(inv => isCurrentQuarter(inv.issued_date))
  const subtotal = quarterInvoices.reduce((s, inv) => s + (inv.subtotal ?? inv.total ?? 0), 0)
  const { vatAmount, total } = calculateVat(subtotal, vatRate)

  return (
    <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', padding: '20px 24px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t('vatLiability')}</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
            {t('vatQuarterInfo', { quarter: getCurrentQuarterLabel(), country: countryCode, rate: defaultRate })}
          </p>
        </div>
        <button
          onClick={() => setOverriding(o => !o)}
          style={{ fontSize: '12px', color: 'var(--omnexia-accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {overriding ? t('vatOverrideDone') : t('vatOverrideRate')}
        </button>
      </div>

      {overriding && (
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('vatCustomRate')}</label>
          <input
            type="number"
            min={0}
            max={30}
            step={0.1}
            value={vatRate}
            onChange={e => setVatRate(parseFloat(e.target.value) || 0)}
            style={{ width: '70px', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', backgroundColor: 'var(--bg-elevated)' }}
          />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span>{t('vatSubtotal')}</span>
          <span>€{subtotal.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span>{t('vatLine', { rate: vatRate })}</span>
          <span>€{vatAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
          <span>{t('vatTotal')}</span>
          <span>€{total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', marginBottom: 0 }}>
        {t('vatFootnote', { count: quarterInvoices.length })}
      </p>
    </div>
  )
}
