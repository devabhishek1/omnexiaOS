'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function NoBusinessPage() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F6F6F1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E5E5E5', padding: '48px 40px', maxWidth: '440px', width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '24px' }}>
          ✕
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
          No active business
        </h1>
        <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6, margin: '0 0 32px' }}>
          You are no longer a member of any business on Omnexia. Contact your employer if you believe this is a mistake.
        </p>
        <button
          onClick={handleSignOut}
          style={{ padding: '10px 24px', backgroundColor: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
