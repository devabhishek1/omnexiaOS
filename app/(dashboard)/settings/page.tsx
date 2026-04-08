'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import BusinessTab from '@/components/settings/BusinessTab'
import IntegrationsTab from '@/components/settings/IntegrationsTab'
import NotificationsTab from '@/components/settings/NotificationsTab'
import AccountTab from '@/components/settings/AccountTab'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'

function SettingsSkeleton() {
  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      <Skeleton style={{ width: '120px', height: '22px', marginBottom: '6px', borderRadius: '6px' }} />
      <Skeleton style={{ width: '280px', height: '13px', marginBottom: '28px', borderRadius: '4px' }} />
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
        {[80, 90, 100, 72].map((w, i) => (
          <Skeleton key={i} style={{ width: w, height: '34px', borderRadius: '6px' }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '560px' }}>
        {[52, 52, 52, 80, 120].map((h, i) => (
          <Skeleton key={i} style={{ width: '100%', height: h, borderRadius: '8px' }} />
        ))}
      </div>
    </div>
  )
}

type TabValue = 'business' | 'integrations' | 'notifications' | 'account'

function SettingsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const t = useTranslations('settings')
  const tabParam = searchParams.get('tab') as TabValue | null
  const [activeTab, setActiveTab] = useState<TabValue>(tabParam ?? 'business')

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) setActiveTab(tabParam)
  }, [tabParam])

  function handleTabChange(value: string) {
    setActiveTab(value as TabValue)
    router.replace(`/settings?tab=${value}`, { scroll: false })
  }

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          {t('title')}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {t('subtitle')}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList variant="line" style={{ marginBottom: '28px', borderBottom: '1px solid var(--border-default)', width: '100%', borderRadius: 0, padding: 0 }}>
          {(['business', 'integrations', 'notifications', 'account'] as TabValue[]).map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500 }}
            >
              {tab === 'business' ? t('tabBusiness') : tab === 'integrations' ? t('tabIntegrations') : tab === 'notifications' ? t('tabNotifications') : t('tabAccount')}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="business"><BusinessTab /></TabsContent>
        <TabsContent value="integrations"><IntegrationsTab /></TabsContent>
        <TabsContent value="notifications"><NotificationsTab /></TabsContent>
        <TabsContent value="account"><AccountTab /></TabsContent>
      </Tabs>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  )
}
