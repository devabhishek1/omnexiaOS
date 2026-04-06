import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { User, Business } from '@/types/database'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { DashboardProvider } from '@/components/layout/DashboardContext'
import { Toaster } from 'sonner'
import { headers } from 'next/headers'

// Modules an employee can be granted access to (in priority order for default redirect)
const EMPLOYEE_MODULES = ['communications', 'finance', 'planning', 'team'] as const
// Routes only admins can access
const ADMIN_ONLY_PATHS = ['/overview', '/settings']

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

  // Route guard: employees cannot access overview or settings
  if (userProfile.role !== 'admin') {
    const headersList = await headers()
    const pathname = headersList.get('x-pathname') ?? ''

    const isAdminOnlyPath = ADMIN_ONLY_PATHS.some(p => pathname.startsWith(p))
    if (isAdminOnlyPath) {
      // Redirect to first accessible module
      const moduleAccess = (userProfile.module_access ?? {}) as Record<string, boolean>
      const firstModule = EMPLOYEE_MODULES.find(m => moduleAccess[m] === true)
      redirect(firstModule ? `/${firstModule}` : '/communications')
    }
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
