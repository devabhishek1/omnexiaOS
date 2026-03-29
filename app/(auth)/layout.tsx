import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Omnexia — Sign in',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Auth pages handle their own full-screen layout via AuthCard.
  // This layout is intentionally minimal — no sidebar, no topbar.
  return <>{children}</>
}
