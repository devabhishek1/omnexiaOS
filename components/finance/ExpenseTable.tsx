'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Trash2, Download, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Expense {
  id: string
  description: string
  amount: number
  currency: string
  category: string
  receipt_url: string | null
  date: string
}

interface Props {
  expenses: Expense[]
  businessId: string
  onExpenseAdded: (expense: Expense) => void
  onExpenseDeleted: (id: string) => void
}

const CATEGORIES = ['Office', 'Travel', 'Software', 'Marketing', 'Equipment', 'Meals', 'Other']

function fmt(n: number, currency = 'EUR') {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(n)
}

export default function ExpenseTable({ expenses, businessId, onExpenseAdded, onExpenseDeleted }: Props) {
  const t = useTranslations('finance')
  const tc = useTranslations('common')
  const [adding, setAdding] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Other')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  async function handleAdd() {
    if (!description.trim() || !amount) return
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        business_id: businessId,
        description: description.trim(),
        amount: parseFloat(amount),
        category,
        date,
        currency: 'EUR',
      })
      .select()
      .single()

    if (!error && data) {
      onExpenseAdded(data as Expense)
      setDescription(''); setAmount(''); setCategory('Other'); setDate(new Date().toISOString().split('T')[0])
      setAdding(false)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('expenses').delete().eq('id', id)
    onExpenseDeleted(id)
  }

  async function handleReceiptUpload(expenseId: string, file: File) {
    setUploadingId(expenseId)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${businessId}/${expenseId}.${ext}`
    const { error: uploadError } = await supabase.storage.from('receipts').upload(path, file, { upsert: true })
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(path)
      await supabase.from('expenses').update({ receipt_url: urlData.publicUrl }).eq('id', expenseId)
    }
    setUploadingId(null)
  }

  function exportCSV() {
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Receipt']
    const rows = expenses.map(e => [e.date, e.description, e.category, e.amount.toFixed(2), e.receipt_url ?? ''])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'expenses.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', padding: '20px 24px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t('expenses')}</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', fontSize: '12px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <Download size={12} /> {t('exportCSV')}
          </button>
          <button onClick={() => setAdding(a => !a)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', backgroundColor: 'var(--omnexia-accent)', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={12} /> {t('newExpense')}
          </button>
        </div>
      </div>

      {/* Add row */}
      {adding && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', marginBottom: '12px', padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: '8px' }}>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder={t('description')} style={inputStyle} />
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (€)" style={inputStyle} />
          <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={handleAdd} disabled={saving} style={{ padding: '6px 14px', backgroundColor: 'var(--omnexia-accent)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              {saving ? '…' : tc('save')}
            </button>
            <button onClick={() => setAdding(false)} style={{ padding: '6px 10px', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
          </div>
        </div>
      )}

      {/* Table */}
      {expenses.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>{t('noExpenses')}</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[tc('date'), t('description'), t('expenseCategory'), tc('amount'), 'Receipt', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 0', color: 'var(--text-muted)', fontWeight: 500, fontSize: '12px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 0', color: 'var(--text-muted)' }}>{new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td style={{ padding: '10px 8px', color: 'var(--text-primary)' }}>{e.description}</td>
                <td style={{ padding: '10px 8px' }}>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>{e.category}</span>
                </td>
                <td style={{ padding: '10px 8px', fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(e.amount, e.currency)}</td>
                <td style={{ padding: '10px 8px' }}>
                  {e.receipt_url ? (
                    <a href={e.receipt_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--omnexia-accent)' }}>View</a>
                  ) : (
                    <label style={{ cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Upload size={11} /> {uploadingId === e.id ? 'Uploading…' : 'Upload'}
                      <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={ev => ev.target.files?.[0] && handleReceiptUpload(e.id, ev.target.files[0])} />
                    </label>
                  )}
                </td>
                <td style={{ padding: '10px 0', textAlign: 'right' }}>
                  <button onClick={() => handleDelete(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <Trash2 size={13} color="var(--text-muted)" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }
