'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { actionLabel } from '@/lib/utils/activityLog'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ActivityLogEntry {
  id: string
  user_id: string | null
  action: string
  target_type: string | null
  target_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

interface User { id: string; full_name: string }

interface Props {
  logs: ActivityLogEntry[]
  users: User[]
}

const PAGE_SIZE = 20

export default function ActivityLog({ logs, users }: Props) {
  const t = useTranslations('team')
  const [filterUser, setFilterUser] = useState('all')
  const [filterAction, setFilterAction] = useState('all')
  const [page, setPage] = useState(1)

  function getUserName(id: string | null): string {
    if (!id) return 'System'
    return users.find(u => u.id === id)?.full_name ?? 'Unknown'
  }

  const actionTypes = Array.from(new Set(logs.map(l => l.action))).sort()

  const filtered = logs.filter(l => {
    if (filterUser !== 'all' && l.user_id !== filterUser) return false
    if (filterAction !== 'all' && l.action !== filterAction) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
      {/* Header + filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '8px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t('activityLog')}</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select value={filterUser} onChange={e => { setFilterUser(e.target.value); setPage(1) }} style={selectStyle}>
            <option value="all">{t('allMembers')}</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>
          <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1) }} style={selectStyle}>
            <option value="all">{t('allActions')}</option>
            {actionTypes.map(a => <option key={a} value={a}>{actionLabel(a)}</option>)}
          </select>
        </div>
      </div>

      {paged.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '32px' }}>{t('noActivityRecorded')}</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[t('tableHeaderMember'), t('tableHeaderAction'), t('tableHeaderTarget'), t('joined')].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((log, i) => (
              <tr key={log.id} style={{ borderBottom: i < paged.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{getUserName(log.user_id)}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{actionLabel(log.action)}</td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {log.target_type ? `${log.target_type}${log.target_id ? ` · ${log.target_id.slice(0, 8)}…` : ''}` : '—'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(log.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '12px', borderTop: '1px solid var(--border)' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: page === 1 ? 0.4 : 1 }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('pageOf', { page, total: totalPages })}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: page === totalPages ? 0.4 : 1 }}>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

const selectStyle: React.CSSProperties = { padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer' }
