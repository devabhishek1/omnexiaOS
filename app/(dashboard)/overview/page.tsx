import dynamic from 'next/dynamic'
import { AlertStrip } from '@/components/overview/AlertStrip'
import { StatCards } from '@/components/overview/StatCards'
import { QuickActions } from '@/components/overview/QuickActions'

// Lazy-load heavy components that are below the fold or AI-driven
const DigestCard = dynamic(() => import('@/components/overview/DigestCard').then(m => ({ default: m.DigestCard })), {
  loading: () => <div style={{ height: '120px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }} />,
})
const LatestMessages = dynamic(() => import('@/components/overview/LatestMessages').then(m => ({ default: m.LatestMessages })), {
  loading: () => <div style={{ height: '300px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }} />,
})
const FinanceSnapshot = dynamic(() => import('@/components/overview/FinanceSnapshot').then(m => ({ default: m.FinanceSnapshot })), {
  loading: () => <div style={{ height: '300px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }} />,
})
const WhoIsIn = dynamic(() => import('@/components/overview/WhoIsIn').then(m => ({ default: m.WhoIsIn })), {
  loading: () => <div style={{ height: '140px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }} />,
})

export default function OverviewPage() {
  return (
    <>
      {/* Alert strip — outside padding, full bleed */}
      <div style={{ margin: '-28px -28px 0 -28px' }}>
        <AlertStrip />
      </div>

      {/* Main content with vertical spacing */}
      <div
        className="flex flex-col"
        style={{ gap: '24px', paddingTop: '28px' }}
      >
        {/* AI Digest */}
        <DigestCard />

        {/* 4 Stat Cards */}
        <StatCards />

        {/* Quick Actions */}
        <QuickActions />

        {/* Two-column row: Messages (60%) + Finance (40%) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '3fr 2fr',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          <LatestMessages />
          <FinanceSnapshot />
        </div>

        {/* Who's In Today */}
        <WhoIsIn />
      </div>
    </>
  )
}
