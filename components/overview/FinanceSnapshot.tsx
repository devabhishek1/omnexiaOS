import { Card } from '@/components/layout/Card'
import { SectionTitle } from '@/components/layout/SectionTitle'
import { Badge } from '@/components/layout/Badge'

const currentMonth = new Date().toLocaleDateString('en-GB', {
  month: 'long',
  year: 'numeric',
})

interface InvoiceRow {
  client: string
  date: string
  amount: string
  status: 'paid' | 'pending' | 'overdue'
}

const MOCK_INVOICES: InvoiceRow[] = [
  { client: 'Acme SAS', date: '28 Mar', amount: '€2,400', status: 'paid' },
  { client: 'Studio Blanc', date: '31 Mar', amount: '€1,800', status: 'pending' },
  { client: 'TechParis', date: '20 Mar', amount: '€4,220', status: 'overdue' },
]

const statusVariant: Record<InvoiceRow['status'], 'success' | 'warning' | 'error'> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'error',
}

const statusLabel: Record<InvoiceRow['status'], string> = {
  paid: 'Paid',
  pending: 'Pending',
  overdue: 'Overdue',
}

export function FinanceSnapshot() {
  return (
    <Card>
      <SectionTitle>Finance — {currentMonth.toUpperCase()}</SectionTitle>

      {/* 3 metric columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              margin: '0 0 4px 0',
            }}
          >
            Revenue
          </p>
          <p
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--green)',
              margin: 0,
            }}
          >
            €12,480
          </p>
        </div>
        <div>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              margin: '0 0 4px 0',
            }}
          >
            Expenses
          </p>
          <p
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--red)',
              margin: 0,
            }}
          >
            €4,210
          </p>
        </div>
        <div>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              margin: '0 0 4px 0',
            }}
          >
            Net
          </p>
          <p
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            €8,270
          </p>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-default)', margin: '0 0 20px 0' }} />

      <SectionTitle>Latest Invoices</SectionTitle>
      <div className="flex flex-col" style={{ gap: '12px' }}>
        {MOCK_INVOICES.map((inv, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between"
          >
            <div>
              <p
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: '0 0 2px 0',
                }}
              >
                {inv.client}
              </p>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  margin: 0,
                }}
              >
                {inv.date}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {inv.amount}
              </span>
              <Badge label={statusLabel[inv.status]} variant={statusVariant[inv.status]} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
