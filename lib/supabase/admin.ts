import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side admin client using the service role key.
 * Bypasses RLS entirely. Use ONLY in server-side code for
 * operations that must bypass user-level policies (e.g. the
 * OAuth callback creating the user row on first login).
 *
 * Never expose this client to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
