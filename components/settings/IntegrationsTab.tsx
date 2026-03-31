'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Papa from 'papaparse'

type GmailStatus = {
  connected: boolean
  email?: string
  lastSynced?: string | null
  watchExpiry?: string | null
}

type PennylaneStatus = {
  connected: boolean
  lastSynced?: string | null
}

type CsvPreviewRow = Record<string, string>

export default function IntegrationsTab() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const fileRef = useRef<HTMLInputElement>(null)

  const [gmail, setGmail] = useState<GmailStatus>({ connected: false })
  const [pennylane, setPennylane] = useState<PennylaneStatus>({ connected: false })
  const [csvPreview, setCsvPreview] = useState<CsvPreviewRow[] | null>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null)

  useEffect(() => {
    loadStatuses()

    const pennylaneConnected = searchParams.get('pennylane_connected')
    const error = searchParams.get('error')
    if (pennylaneConnected) toast.success('Pennylane connected successfully')
    if (error === 'pennylane_oauth_failed') toast.error('Pennylane connection failed')
    if (error === 'pennylane_not_configured') toast.error('Pennylane not configured — add PENNYLANE_CLIENT_ID to .env')
  }, [])

  async function loadStatuses() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Gmail
    const { data: gmailRow } = await supabase
      .from('gmail_tokens')
      .select('email, last_synced_at, watch_expiry')
      .eq('user_id', user.id)
      .maybeSingle()
    if (gmailRow) {
      setGmail({ connected: true, email: gmailRow.email, lastSynced: gmailRow.last_synced_at, watchExpiry: gmailRow.watch_expiry })
    }

    // Pennylane
    const { data: userRow } = await supabase.from('users').select('business_id').eq('id', user.id).single()
    if (userRow?.business_id) {
      const { data: integration } = await supabase
        .from('integrations')
        .select('status, last_synced_at')
        .eq('business_id', userRow.business_id)
        .eq('provider', 'pennylane')
        .maybeSingle()
      if (integration) {
        setPennylane({ connected: integration.status === 'connected', lastSynced: integration.last_synced_at })
      }
    }
  }

  async function disconnectGmail() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('gmail_tokens').delete().eq('user_id', user.id)
    setGmail({ connected: false })
    toast.success('Gmail disconnected')
  }

  async function disconnectPennylane() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: userRow } = await supabase.from('users').select('business_id').eq('id', user.id).single()
    if (!userRow?.business_id) return
    await supabase.from('integrations').delete().eq('business_id', userRow.business_id).eq('provider', 'pennylane')
    setPennylane({ connected: false })
    toast.success('Pennylane disconnected')
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFile(file)
    setCsvPreview(null)
    setImportResult(null)

    Papa.parse<CsvPreviewRow>(file, {
      header: true,
      skipEmptyLines: true,
      preview: 5,
      complete: (results) => {
        setCsvPreview(results.data)
      },
    })
  }

  async function handleImport() {
    if (!csvFile) return
    setImporting(true)
    const formData = new FormData()
    formData.append('file', csvFile)
    const res = await fetch('/api/finance/import', { method: 'POST', body: formData })
    const data = await res.json()
    setImportResult(data)
    setImporting(false)
    if (data.imported > 0) toast.success(`Imported ${data.imported} invoice(s)`)
    else toast.error('No invoices imported')
  }

  async function handleExport(type: 'all' | 'invoices' | 'expenses') {
    const res = await fetch(`/api/account/export?type=${type}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `omnexia-export-${type}.${type === 'all' ? 'json' : 'csv'}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const watchActive = gmail.watchExpiry ? new Date(gmail.watchExpiry) > new Date() : false

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '680px' }}>

      {/* Communications */}
      <section>
        <h2 style={sectionHeadingStyle}>Communications</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Gmail */}
          <IntegrationCard
            icon="✉️"
            title="Gmail"
            description="Sync your inbox and send replies directly from Omnexia"
          >
            {gmail.connected ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={greenDotStyle} />
                  <span style={statusTextStyle}>Connected as {gmail.email}</span>
                </div>
                <span style={mutedTextStyle}>Last synced: {gmail.lastSynced ? new Date(gmail.lastSynced).toLocaleString() : 'Never'}</span>
                <span style={mutedTextStyle}>{watchActive ? '🟢 Real-time sync active' : '🔴 Webhook inactive — reconnect to restore'}</span>
                <div style={{ marginTop: '8px' }}>
                  <button onClick={disconnectGmail} style={dangerBtnStyle}>Disconnect</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <span style={redDotStyle} />
                  <span style={statusTextStyle}>Not connected</span>
                </div>
                <a href="/api/auth/gmail/connect" style={primaryBtnStyle as React.CSSProperties}>Connect Gmail</a>
              </div>
            )}
          </IntegrationCard>

          {/* Instagram */}
          <IntegrationCard
            icon="📸"
            title="Instagram"
            description="Receive and reply to Instagram DMs"
            comingSoon
          />

          {/* Facebook */}
          <IntegrationCard
            icon="💬"
            title="Facebook Messenger"
            description="Receive and reply to Facebook messages"
            comingSoon
          />
        </div>
      </section>

      {/* Finance */}
      <section>
        <h2 style={sectionHeadingStyle}>Finance</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Pennylane */}
          <IntegrationCard
            icon="💰"
            title="Pennylane"
            description="The most popular invoicing tool for French SMBs — sync your invoices automatically"
          >
            {pennylane.connected ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={greenDotStyle} />
                  <span style={statusTextStyle}>Connected</span>
                </div>
                <span style={mutedTextStyle}>Last synced: {pennylane.lastSynced ? new Date(pennylane.lastSynced).toLocaleString() : 'Never'}</span>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <a href="/api/integrations/pennylane/sync" style={secondaryBtnStyle as React.CSSProperties}>Sync now</a>
                  <button onClick={disconnectPennylane} style={dangerBtnStyle}>Disconnect</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <span style={redDotStyle} />
                  <span style={statusTextStyle}>Not connected</span>
                </div>
                <a href="/api/integrations/pennylane/connect" style={primaryBtnStyle as React.CSSProperties}>Connect Pennylane</a>
              </div>
            )}
          </IntegrationCard>

          {/* Axonaut */}
          <IntegrationCard
            icon="📊"
            title="Axonaut"
            description="Connect Axonaut to sync your invoices and quotes"
            comingSoon
          />

          {/* Henrri */}
          <IntegrationCard
            icon="📑"
            title="Henrri by Rivalis"
            description="Connect Henrri to sync your invoices"
            comingSoon
          />

          {/* QuickBooks / Sage */}
          <IntegrationCard
            icon="🏦"
            title="QuickBooks / Sage"
            description="Connect your accounting software"
            comingSoon
          />

          {/* CSV Import */}
          <IntegrationCard
            icon="📥"
            title="Import invoices from CSV / Excel"
            description="Upload a spreadsheet with your existing invoices"
          >
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Expected columns: <strong>Client</strong>, <strong>Amount</strong>, <strong>Status</strong>, <strong>Due Date</strong>
            </div>
            <button onClick={() => fileRef.current?.click()} style={secondaryBtnStyle}>Upload file</button>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={handleCsvFile} />

            {csvPreview && (
              <div style={{ marginTop: '12px', overflowX: 'auto' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Preview (first 5 rows):</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr>
                      {Object.keys(csvPreview[0] ?? {}).map(k => (
                        <th key={k} style={thStyle}>{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((v, j) => (
                          <td key={j} style={tdStyle}>{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button onClick={handleImport} style={primaryBtnStyle} disabled={importing}>
                    {importing ? 'Importing…' : 'Confirm import'}
                  </button>
                  <button onClick={() => { setCsvPreview(null); setCsvFile(null) }} style={secondaryBtnStyle}>Cancel</button>
                </div>
              </div>
            )}

            {importResult && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: importResult.imported > 0 ? 'var(--green)' : 'var(--red)' }}>
                {importResult.imported > 0 ? `✓ Imported ${importResult.imported} invoice(s)` : 'No invoices imported'}
                {importResult.errors.length > 0 && <div style={{ color: 'var(--red)', marginTop: '4px' }}>{importResult.errors.slice(0, 3).join(', ')}</div>}
              </div>
            )}
          </IntegrationCard>

          {/* CSV Export */}
          <IntegrationCard
            icon="📤"
            title="Export data"
            description="Download your invoices and expenses as CSV"
          >
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => handleExport('invoices')} style={secondaryBtnStyle}>Export invoices</button>
              <button onClick={() => handleExport('expenses')} style={secondaryBtnStyle}>Export expenses</button>
              <button onClick={() => handleExport('all')} style={secondaryBtnStyle}>Export all data (JSON)</button>
            </div>
          </IntegrationCard>
        </div>
      </section>

      {/* Calendar */}
      <section>
        <h2 style={sectionHeadingStyle}>Calendar</h2>
        <IntegrationCard
          icon="📅"
          title="Google Calendar"
          description="Sync shifts and time-off with Google Calendar"
          comingSoon
        />
      </section>
    </div>
  )
}

function IntegrationCard({
  icon, title, description, comingSoon, children,
}: {
  icon: string
  title: string
  description: string
  comingSoon?: boolean
  children?: React.ReactNode
}) {
  return (
    <div style={{
      border: '1px solid var(--border-default)',
      borderRadius: '12px',
      padding: '16px 20px',
      background: 'var(--bg-surface)',
      opacity: comingSoon ? 0.7 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
          <span style={{ fontSize: '22px', lineHeight: 1 }}>{icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
              {comingSoon && (
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#b45309', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '4px', padding: '1px 6px' }}>
                  Coming soon
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{description}</p>
            {!comingSoon && children && <div style={{ marginTop: '12px' }}>{children}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

const sectionHeadingStyle: React.CSSProperties = { fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }
const statusTextStyle: React.CSSProperties = { fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }
const mutedTextStyle: React.CSSProperties = { fontSize: '12px', color: 'var(--text-muted)' }
const greenDotStyle: React.CSSProperties = { width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }
const redDotStyle: React.CSSProperties = { width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', flexShrink: 0 }
const primaryBtnStyle: React.CSSProperties = { display: 'inline-block', background: 'var(--omnexia-accent)', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }
const secondaryBtnStyle: React.CSSProperties = { display: 'inline-block', background: 'var(--bg-muted)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }
const dangerBtnStyle: React.CSSProperties = { background: 'transparent', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '4px 8px', background: 'var(--bg-muted)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', fontWeight: 500 }
const tdStyle: React.CSSProperties = { padding: '4px 8px', borderBottom: '1px solid var(--border-default)', color: 'var(--text-primary)' }
