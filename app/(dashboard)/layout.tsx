import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { User, Business } from '@/types/database'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { DashboardProvider } from '@/components/layout/DashboardContext'
import { Toaster } from 'sonner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Auth check
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  // Fetch profile
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (!userProfile || !userProfile.onboarding_complete) {
    redirect('/onboarding')
  }

  // Fetch business
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', userProfile.business_id)
    .single()

  if (!business) {
    redirect('/onboarding')
  }

  return (
    <DashboardProvider user={userProfile as User} business={business as Business}>
      <div className="flex min-h-screen bg-[var(--bg-base)]">
        <Sidebar user={userProfile as User} business={business as Business} />
        <div
          className="flex flex-col flex-1 min-w-0"
          style={{ marginLeft: '220px' }}
        >
          <Topbar user={userProfile as User} />
          <main className="flex-1 p-[28px]">{children}</main>
        </div>
      </div>
      <Toaster position="bottom-right" richColors />
    </DashboardProvider>
  )
}
