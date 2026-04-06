'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Business } from '@/types/database'

interface DashboardContextValue {
  user: User
  business: Business
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({
  user: initialUser,
  business,
  children,
}: { user: User; business: Business; children: React.ReactNode }) {
  const [user, setUser] = useState<User>(initialUser)

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
          setUser((prev) => ({ ...prev, ...(payload.new as Partial<User>) }))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [initialUser.id])

  return (
    <DashboardContext.Provider value={{ user, business }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider')
  return ctx
}
