import { AlertStrip } from '@/components/overview/AlertStrip'
import { DigestCard } from '@/components/overview/DigestCard'
import { StatCards } from '@/components/overview/StatCards'
import { QuickActions } from '@/components/overview/QuickActions'
import { LatestMessages } from '@/components/overview/LatestMessages'
import { FinanceSnapshot } from '@/components/overview/FinanceSnapshot'
import { WhoIsIn } from '@/components/overview/WhoIsIn'

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
