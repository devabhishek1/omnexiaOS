import { Card } from '@/components/layout/Card'
import { SectionTitle } from '@/components/layout/SectionTitle'

type EmployeeStatus = 'in' | 'partial' | 'leave'

interface EmployeeChip {
  name: string
  initials: string
  status: EmployeeStatus
}

const statusColors: Record<EmployeeStatus, string> = {
  in: 'var(--green)',
  partial: 'var(--amber)',
  leave: 'var(--text-disabled)',
}

const statusLabels: Record<EmployeeStatus, string> = {
  in: 'In',
  partial: 'Partial',
  leave: 'Leave',
}

const MOCK_EMPLOYEES: EmployeeChip[] = [
  { name: 'Sophie', initials: 'SO', status: 'in' },
  { name: 'Thomas', initials: 'TH', status: 'in' },
  { name: 'Marc', initials: 'MA', status: 'leave' },
  { name: 'Léa', initials: 'LÉ', status: 'in' },
  { name: 'Julie', initials: 'JU', status: 'in' },
]

export function WhoIsIn() {
  return (
    <Card>
      <SectionTitle>Who&apos;s In Today</SectionTitle>
      <div className="flex items-center flex-wrap" style={{ gap: '12px' }}>
        {MOCK_EMPLOYEES.map((emp) => (
          <div
            key={emp.name}
            className="flex flex-col items-center"
            style={{ gap: '6px' }}
          >
            {/* Avatar with status ring */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: emp.status === 'leave'
                    ? 'var(--bg-elevated)'
                    : 'var(--omnexia-accent-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: emp.status === 'leave'
                    ? 'var(--text-disabled)'
                    : 'var(--omnexia-accent)',
                  letterSpacing: '0.02em',
                  border: `2px solid ${statusColors[emp.status]}`,
                  opacity: emp.status === 'leave' ? 0.6 : 1,
                }}
              >
                {emp.initials}
              </div>
              {/* Status dot */}
              <span
                style={{
                  position: 'absolute',
                  bottom: '1px',
                  right: '1px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: statusColors[emp.status],
                  border: '2px solid var(--bg-surface)',
                }}
              />
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: emp.status === 'leave'
                  ? 'var(--text-disabled)'
                  : 'var(--text-secondary)',
                textAlign: 'center',
              }}
            >
              {emp.name}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: statusColors[emp.status],
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {statusLabels[emp.status]}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
