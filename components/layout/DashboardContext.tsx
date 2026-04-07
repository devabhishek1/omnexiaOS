'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User, Business, UserBusiness } from '@/types/database'

interface DashboardContextValue {
  user: User
  business: Business
  allBusinesses: UserBusiness[]
  switchBusiness: (businessId: string) => Promise<void>
  switching: boolean
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({
  user: initialUser,
  business,
  allBusinesses,
  children,
}: {
  user: User
  business: Business
  allBusinesses: UserBusiness[]
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User>(initialUser)
  const [switching, setSwitching] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Subscribe to real-time changes on this user's row (module_access, role, status)
    const channel = supabase
      .channel(`user-${initialUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${initialUser.id}`,
        },
        (payload) => {
          const updated = payload.new as Partial<User>
          setUser((prev) => ({ ...prev, ...updated }))
          if (updated.status === 'deactivated') {
            router.refresh()
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [initialUser.id])

  const switchBusiness = useCallback(async (businessId: string) => {
    if (businessId === (user.active_business_id ?? user.business_id)) return
    setSwitching(true)
    try {
      const res = await fetch('/api/user/switch-business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      })
      if (!res.ok) throw new Error('Switch failed')
      // Refresh all server components to load new business data
      router.refresh()
    } catch (err) {
      console.error('[switchBusiness]', err)
    } finally {
      setSwitching(false)
    }
  }, [user.active_business_id, user.business_id, router])

  return (
    <DashboardContext.Provider value={{ user, business, allBusinesses, switchBusiness, switching }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider')
  return ctx
}
