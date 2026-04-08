import dynamic from 'next/dynamic'
import { AlertStrip } from '@/components/overview/AlertStrip'
import { StatCards } from '@/components/overview/StatCards'
import { QuickActions } from '@/components/overview/QuickActions'
import { Skeleton } from '@/components/ui/skeleton'

function CardShell({ height, children }: { height: number; children?: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '20px', height }}>
      {children}
    </div>
  )
}

// Lazy-load heavy components that are below the fold or AI-driven
const DigestCard = dynamic(() => import('@/components/overview/DigestCard').then(m => ({ default: m.DigestCard })), {
  loading: () => (
    <div style={{ background: 'var(--dark-card)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px' }}>
      {/* Dark card — use muted dark shimmers instead of the light skeleton */}
      <div style={{ width: '160px', height: '13px', marginBottom: '14px', borderRadius: '4px', background: 'linear-gradient(90deg,#2A2A2A 25%,#333 50%,#2A2A2A 75%)', backgroundSize: '200% 100%', animation: 'skeleton-shimmer 1.4s ease-in-out infinite' }} />
      <div style={{ width: '90%', height: '12px', marginBottom: '8px', borderRadius: '4px', background: 'linear-gradient(90deg,#2A2A2A 25%,#333 50%,#2A2A2A 75%)', backgroundSize: '200% 100%', animation: 'skeleton-shimmer 1.4s ease-in-out infinite' }} />
      <div style={{ width: '75%', height: '12px', borderRadius: '4px', background: 'linear-gradient(90deg,#2A2A2A 25%,#333 50%,#2A2A2A 75%)', backgroundSize: '200% 100%', animation: 'skeleton-shimmer 1.4s ease-in-out infinite' }} />
    </div>
  ),
})
const LatestMessages = dynamic(() => import('@/components/overview/LatestMessages').then(m => ({ default: m.LatestMessages })), {
  loading: () => (
    <CardShell height={300}>
      <Skeleton style={{ width: '120px', height: '12px', marginBottom: '16px', borderRadius: '4px' }} />
      {[80, 65, 70].map((w, i) => (
        <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
          <Skeleton style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <Skeleton style={{ width: `${w}%`, height: '11px', marginBottom: '6px', borderRadius: '4px' }} />
            <Skeleton style={{ width: '45%', height: '10px', borderRadius: '4px' }} />
          </div>
        </div>
      ))}
    </CardShell>
  ),
})
const FinanceSnapshot = dynamic(() => import('@/components/overview/FinanceSnapshot').then(m => ({ default: m.FinanceSnapshot })), {
  loading: () => (
    <CardShell height={300}>
      <Skeleton style={{ width: '140px', height: '12px', marginBottom: '20px', borderRadius: '4px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        {[1,2,3].map(i => <Skeleton key={i} style={{ height: '40px', borderRadius: '6px' }} />)}
      </div>
      <Skeleton style={{ width: '80px', height: '11px', marginBottom: '12px', borderRadius: '4px' }} />
      {[1,2].map(i => <Skeleton key={i} style={{ height: '32px', borderRadius: '6px', marginBottom: '8px' }} />)}
    </CardShell>
  ),
})
const WhoIsIn = dynamic(() => import('@/components/overview/WhoIsIn').then(m => ({ default: m.WhoIsIn })), {
  loading: () => (
    <CardShell height={120}>
      <Skeleton style={{ width: '100px', height: '11px', marginBottom: '14px', borderRadius: '4px' }} />
      <div style={{ display: 'flex', gap: '10px' }}>
        {[1,2,3,4,5].map(i => <Skeleton key={i} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />)}
      </div>
    </CardShell>
  ),
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
