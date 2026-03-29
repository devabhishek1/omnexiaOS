import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Omnexia — Setup',
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  // Each step page renders full-screen via the wizard controller.
  // No sidebar or topbar — just the children.
  return <>{children}</>
}
