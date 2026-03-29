'use client'

import { createContext, useContext } from 'react'
import type { User, Business } from '@/types/database'

interface DashboardContextValue {
  user: User
  business: Business
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({
  user,
  business,
  children,
}: DashboardContextValue & { children: React.ReactNode }) {
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
