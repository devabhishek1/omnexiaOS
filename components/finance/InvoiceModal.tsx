'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { X, Plus, Trash2 } from 'lucide-react'
import { getVatRate, calculateVat } from '@/lib/utils/vat'

interface LineItem { description: string; quantity: number; unit_price: number }

interface Props {
  open: boolean
  onClose: () => void
  onSave: (invoice: InvoicePayload) => Promise<void>
  countryCode: string
  businessVatRate?: number | null
}

export interface InvoicePayload {
  client_name: string
  client_email: string
  line_items: LineItem[]
  subtotal: number
  vat_rate: number
  vat_amount: number
  total: number
  due_date: string
  notes: string
  currency: string
  source: 'native'
}

const emptyLine = (): LineItem => ({ description: '', quantity: 1, unit_price: 0 })

export default function InvoiceModal({ open, onClose, onSave, countryCode, businessVatRate }: Props) {
  const t = useTranslations('finance')
  const tc = useTranslations('common')
  const defaultVat = businessVatRate ?? getVatRate(countryCode)
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [lines, setLines] = useState<LineItem[]>([emptyLine()])
  const [vatRate, setVatRate] = useState(defaultVat)
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0)
  const { vatAmount, total } = calculateVat(subtotal, vatRate)

  function updateLine(idx: number, field: keyof LineItem, value: string | number) {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  function addLine() { setLines(prev => [...prev, emptyLine()]) }
  function removeLine(idx: number) { setLines(prev => prev.filter((_, i) => i !== idx)) }

  async function handleSave() {
    if (!clientName.trim()) { setError('Client name is required'); return }
    if (!dueDate) { setError('Due date is required'); return }
    setError('')
    setSaving(true)
    try {
      await onSave({
        client_name: clientName.trim(),
        client_email: clientEmail.trim(),
        line_items: lines.filter(l => l.description.trim()),
        subtotal: Math.round(subtotal * 100) / 100,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total,
        due_date: dueDate,
        notes: notes.trim(),
        currency: 'EUR',
        source: 'native',
      })
      // Reset
      setClientName(''); setClientEmail(''); setLines([emptyLine()]); setVatRate(defaultVat); setDueDate(''); setNotes('')
      onClose()
    } catch {
      setError('Failed to save invoice. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('createInvoice')}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={18} color="var(--text-muted)" />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Client */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>{t('clientName')} *</label>
              <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Acme Corp" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('clientEmail')}</label>
              <input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="billing@acme.com" style={inputStyle} />
            </div>
          </div>

          {/* Line items */}
          <div>
            <label style={labelStyle}>{t('lineItems')}</label>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 0', color: 'var(--text-muted)', fontWeight: 500 }}>{t('description')}</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--text-muted)', fontWeight: 500, width: '70px' }}>{t('quantity')}</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--text-muted)', fontWeight: 500, width: '90px' }}>{t('unitPrice')}</th>
                  <th style={{ textAlign: 'right', padding: '6px 0', color: 'var(--text-muted)', fontWeight: 500, width: '80px' }}>{t('total')}</th>
                  <th style={{ width: '32px' }} />
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i}>
                    <td style={{ paddingRight: '8px', paddingTop: '6px' }}>
                      <input value={l.description} onChange={e => updateLine(i, 'description', e.target.value)} placeholder="Service description" style={{ ...inputStyle, margin: 0 }} />
                    </td>
                    <td style={{ paddingLeft: '8px', paddingTop: '6px' }}>
                      <input type="number" min={1} value={l.quantity} onChange={e => updateLine(i, 'quantity', parseFloat(e.target.value) || 1)} style={{ ...inputStyle, margin: 0, textAlign: 'right' }} />
                    </td>
                    <td style={{ paddingLeft: '8px', paddingTop: '6px' }}>
                      <input type="number" min={0} step={0.01} value={l.unit_price} onChange={e => updateLine(i, 'unit_price', parseFloat(e.target.value) || 0)} style={{ ...inputStyle, margin: 0, textAlign: 'right' }} />
                    </td>
                    <td style={{ textAlign: 'right', paddingLeft: '8px', paddingTop: '6px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      €{(l.quantity * l.unit_price).toFixed(2)}
                    </td>
                    <td style={{ paddingLeft: '8px', paddingTop: '6px' }}>
                      {lines.length > 1 && (
                        <button onClick={() => removeLine(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                          <Trash2 size={13} color="var(--text-muted)" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addLine} style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--omnexia-accent)', fontSize: '13px', cursor: 'pointer', padding: '4px 0' }}>
              <Plus size={14} /> {t('addLineItem')}
            </button>
          </div>

          {/* Totals */}
          <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: '8px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>{t('subtotal')}</span><span>€{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{t('vat')}</span>
                <input type="number" min={0} max={30} step={0.1} value={vatRate} onChange={e => setVatRate(parseFloat(e.target.value) || 0)} style={{ width: '50px', padding: '2px 6px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '12px' }} />
                <span>%</span>
              </div>
              <span>€{vatAmount.toFixed(2)}</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              <span>{t('total')}</span><span>€{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Due date + notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>{t('dueDate')} *</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>{t('notes')}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Payment terms, bank details, etc." style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {error && <p style={{ fontSize: '13px', color: '#DC2626', margin: 0 }}>{error}</p>}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)' }}>{tc('cancel')}</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '8px 20px', borderRadius: '8px', backgroundColor: saving ? 'var(--border-strong)' : 'var(--omnexia-accent)', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? tc('sending') : tc('save')}
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', boxSizing: 'border-box' }
