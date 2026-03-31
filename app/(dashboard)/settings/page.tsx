'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import BusinessTab from '@/components/settings/BusinessTab'
import IntegrationsTab from '@/components/settings/IntegrationsTab'
import NotificationsTab from '@/components/settings/NotificationsTab'
import AccountTab from '@/components/settings/AccountTab'
import { createClient } from '@/lib/supabase/client'

type TabValue = 'business' | 'integrations' | 'notifications' | 'account'

function SettingsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
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
          Settings
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Manage your business, integrations, and account preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList variant="line" style={{ marginBottom: '28px', borderBottom: '1px solid var(--border-default)', width: '100%', borderRadius: 0, padding: 0 }}>
          {(['business', 'integrations', 'notifications', 'account'] as TabValue[]).map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              style={{ textTransform: 'capitalize', padding: '8px 16px', fontSize: '13px', fontWeight: 500 }}
            >
              {tab}
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
    <Suspense fallback={<div style={{ padding: '32px', color: 'var(--text-muted)' }}>Loading…</div>}>
      <SettingsContent />
    </Suspense>
  )
}
