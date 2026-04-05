'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { Plus, ExternalLink, ChevronDown, Upload, X } from 'lucide-react'
import InvoiceModal, { InvoicePayload } from './InvoiceModal'
import Papa from 'papaparse'
import { toast } from 'sonner'

interface Invoice {
  id: string
  client_name: string
  total: number
  currency: string
  status: string
  source: string
  due_date: string | null
  issued_date: string | null
}

interface Props {
  invoices: Invoice[]
  countryCode: string
  businessVatRate?: number | null
  sourceFilter: 'all' | 'native' | 'pennylane'
  onStatusChange: (id: string, newStatus: string) => Promise<void>
  onCreateInvoice: (payload: InvoicePayload) => Promise<void>
  onImported?: () => void
}

const COLUMNS = [
  { key: 'unpaid',  labelKey: 'unpaid',  color: 'var(--text-secondary)' },
  { key: 'sent',    labelKey: 'sent',    color: '#D97706' },
  { key: 'paid',    labelKey: 'paid',    color: 'var(--green)' },
  { key: 'overdue', labelKey: 'overdue', color: '#DC2626' },
]

function fmt(n: number, currency = 'EUR') {
  const curr = (currency ?? '').trim()
  const validCurr = curr.length === 3 ? curr : 'EUR'
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: validCurr }).format(n)
}

function daysDiff(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

// ---------------------------------------------------------------------------
// Status dropdown — shown on each card
// ---------------------------------------------------------------------------

function StatusDropdown({
  invoice,
  onStatusChange,
}: {
  invoice: Invoice
  onStatusChange: (id: string, status: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const t = useTranslations('finance')

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (invoice.source === 'pennylane') return null

  return (
    <div ref={ref} style={{ position: 'relative' }} onMouseDown={e => e.stopPropagation()}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        title="Change status"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          padding: '2px 6px',
          border: '1px solid var(--border)',
          borderRadius: '5px',
          background: 'var(--bg-elevated)',
          cursor: 'pointer',
          fontSize: '11px',
          color: 'var(--text-muted)',
        }}
      >
        {t(invoice.status as 'unpaid' | 'sent' | 'paid' | 'overdue') ?? invoice.status} <ChevronDown size={10} />
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          right: 0,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          zIndex: 50,
          minWidth: '110px',
          overflow: 'hidden',
        }}>
          {COLUMNS.map(col => (
            <button
              key={col.key}
              onClick={(e) => { e.stopPropagation(); setOpen(false); onStatusChange(invoice.id, col.key) }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                border: 'none',
                background: invoice.status === col.key ? 'var(--bg-elevated)' : 'transparent',
                fontSize: '12px',
                color: col.color,
                fontWeight: invoice.status === col.key ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {t(col.labelKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Follow-up button — generates AI email via Mistral then redirects to compose
// ---------------------------------------------------------------------------

function FollowUpButton({ invoice }: { invoice: Invoice }) {
  const [generating, setGenerating] = useState(false)
  const t = useTranslations('finance')

  async function handleFollowUp(e: React.MouseEvent) {
    e.stopPropagation()
    setGenerating(true)
    try {
      const res = await fetch('/api/mistral/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id }),
      })
      const { subject, body } = await res.json()
      const params = new URLSearchParams({
        compose: 'true',
        subject: subject ?? '',
        body: body ?? '',
        client: invoice.client_name,
      })
      window.location.href = `/communications?${params.toString()}`
    } catch {
      // Fallback — open compose without AI content
      window.location.href = `/communications?compose=true&client=${encodeURIComponent(invoice.client_name)}`
    } finally {
      setGenerating(false)
    }
  }

  return (
    <button
      onClick={handleFollowUp}
      disabled={generating}
      onMouseDown={e => e.stopPropagation()}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: generating ? '#aaa' : '#DC2626', padding: '3px 8px', border: '1px solid #FECACA', borderRadius: '6px', backgroundColor: '#FEF2F2', cursor: generating ? 'not-allowed' : 'pointer', background: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
    >
      {generating ? `✦ ${t('followUpAI')}` : <><ExternalLink size={10} /> {t('followUp')}</>}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Invoice card
// ---------------------------------------------------------------------------

function InvoiceCard({
  invoice,
  isDragging,
  onStatusChange,
}: {
  invoice: Invoice
  isDragging?: boolean
  onStatusChange: (id: string, status: string) => void
}) {
  const tf = useTranslations('finance')
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: invoice.id,
    disabled: invoice.source === 'pennylane',
  })

  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined
  const overdueDays = invoice.status === 'overdue' ? daysDiff(invoice.due_date) : null

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '10px',
        padding: '12px 14px',
        border: '1px solid var(--border)',
        cursor: invoice.source === 'pennylane' ? 'default' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : 'none',
        userSelect: 'none',
      }}
      {...(invoice.source !== 'pennylane' ? { ...listeners, ...attributes } : {})}
    >
      {/* Top row: name + source badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', flex: 1, marginRight: '8px' }}>
          {invoice.client_name}
        </span>
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '2px 6px',
          borderRadius: '4px',
          flexShrink: 0,
          backgroundColor: invoice.source === 'pennylane' ? '#DCFCE7' : '#DBEAFE',
          color: invoice.source === 'pennylane' ? '#16A34A' : '#1D4ED8',
        }}>
          {invoice.source === 'pennylane' ? 'Pennylane' : 'Native'}
        </span>
      </div>

      {/* Amount */}
      <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
        {fmt(invoice.total, invoice.currency)}
      </p>

      {/* Due date */}
      {invoice.due_date && (
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
          {tf('invoiceDue', { date: new Date(invoice.due_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) })}
        </p>
      )}

      {/* Overdue warning */}
      {invoice.status === 'overdue' && overdueDays !== null && overdueDays > 0 && (
        <p style={{ fontSize: '11px', color: '#DC2626', fontWeight: 600, margin: '4px 0 0' }}>
          {tf('daysOverdue', { days: overdueDays })}
        </p>
      )}

      {/* Bottom row: follow-up button + status dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
        {invoice.status === 'overdue' ? (
          <FollowUpButton invoice={invoice} />
        ) : <span />}
        <StatusDropdown invoice={invoice} onStatusChange={onStatusChange} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Column
// ---------------------------------------------------------------------------

function Column({
  colKey, label, color, invoices, onStatusChange,
}: {
  colKey: string; label: string; color: string; invoices: Invoice[]
  onStatusChange: (id: string, status: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: colKey })
  const t = useTranslations('finance')

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-elevated)', borderRadius: '20px', padding: '1px 7px' }}>{invoices.length}</span>
      </div>
      <div
        ref={setNodeRef}
        style={{
          minHeight: '120px',
          backgroundColor: isOver ? 'var(--omnexia-accent-light)' : 'var(--bg-elevated)',
          borderRadius: '10px',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          border: '2px dashed',
          borderColor: isOver ? 'var(--omnexia-accent)' : 'transparent',
          transition: 'border-color 0.15s, background-color 0.15s',
        }}
      >
        {invoices.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', margin: 0 }}>{t('noInvoices')}</p>
        ) : (
          invoices.map(inv => (
            <InvoiceCard key={inv.id} invoice={inv} onStatusChange={onStatusChange} />
          ))
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main board
// ---------------------------------------------------------------------------

export default function InvoiceBoard({ invoices, countryCode, businessVatRate, sourceFilter, onStatusChange, onCreateInvoice, onImported }: Props) {
  const t = useTranslations('finance')
  const tc = useTranslations('common')
  const [modalOpen, setModalOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  // CSV import state
  const csvFileRef = useRef<HTMLInputElement>(null)
  const [csvPreview, setCsvPreview] = useState<Record<string, string>[] | null>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  function handleCsvPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFile(file)
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      preview: 5,
      complete: (res) => setCsvPreview(res.data),
    })
    // reset input so same file can be re-picked
    e.target.value = ''
  }

  async function handleCsvImport() {
    if (!csvFile) return
    setImporting(true)
    const fd = new FormData()
    fd.append('file', csvFile)
    const res = await fetch('/api/finance/import', { method: 'POST', body: fd })
    const data = await res.json()
    setImporting(false)
    setCsvPreview(null)
    setCsvFile(null)
    if (data.imported > 0) {
      toast.success(`Imported ${data.imported} invoice(s)`)
      onImported?.()
    } else {
      toast.error(data.errors?.[0] ?? 'No invoices imported')
    }
  }

  // Optimistic local copy — updated immediately, synced when parent prop changes (Realtime)
  const [localInvoices, setLocalInvoices] = useState<Invoice[]>(invoices)
  useEffect(() => { setLocalInvoices(invoices) }, [invoices])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const filtered = localInvoices.filter(inv => sourceFilter === 'all' || inv.source === sourceFilter)

  // Optimistic update — apply immediately, persist in background
  function applyStatusChange(id: string, newStatus: string) {
    setLocalInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv))
    onStatusChange(id, newStatus).catch(() => {
      // rollback on error
      setLocalInvoices(invoices)
    })
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string)
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const targetCol = over.id as string
    const inv = localInvoices.find(i => i.id === active.id)
    if (!inv || inv.status === targetCol || inv.source === 'pennylane') return
    applyStatusChange(inv.id, targetCol)
  }

  const activeInvoice = activeId ? localInvoices.find(i => i.id === activeId) : null

  return (
    <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', padding: '20px 24px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t('invoices')}</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => csvFileRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
          >
            <Upload size={13} /> {t('importCSV')}
          </button>
          <input ref={csvFileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={handleCsvPick} />
          <button
            onClick={() => setModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', backgroundColor: 'var(--omnexia-accent)', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={14} /> {t('createInvoice')}
          </button>
        </div>
      </div>

      {/* CSV Import preview */}
      {csvPreview && (
        <div style={{ marginBottom: '16px', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', background: 'var(--bg-elevated)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Preview — {csvFile?.name} (first 5 rows)
            </span>
            <button onClick={() => { setCsvPreview(null); setCsvFile(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr>
                  {Object.keys(csvPreview[0] ?? {}).map(k => (
                    <th key={k} style={{ textAlign: 'left', padding: '4px 8px', background: 'var(--bg-muted)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvPreview.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v, j) => (
                      <td key={j} style={{ padding: '4px 8px', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCsvImport}
              disabled={importing}
              style={{ padding: '7px 16px', borderRadius: '8px', backgroundColor: 'var(--omnexia-accent)', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 600, cursor: importing ? 'not-allowed' : 'pointer', opacity: importing ? 0.7 : 1 }}
            >
              {importing ? tc('sending') : tc('confirm')}
            </button>
            <button onClick={() => { setCsvPreview(null); setCsvFile(null) }} style={{ padding: '7px 14px', borderRadius: '8px', background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontSize: '12px', cursor: 'pointer' }}>
              {tc('cancel')}
            </button>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {COLUMNS.map(col => (
            <Column
              key={col.key}
              colKey={col.key}
              label={t(col.labelKey)}
              color={col.color}
              invoices={filtered.filter(inv => inv.status === col.key)}
              onStatusChange={applyStatusChange}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
          {activeInvoice ? <InvoiceCard invoice={activeInvoice} isDragging onStatusChange={() => {}} /> : null}
        </DragOverlay>
      </DndContext>

      <InvoiceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={onCreateInvoice}
        countryCode={countryCode}
        businessVatRate={businessVatRate}
      />
    </div>
  )
}
