/**
 * React.cache() wrappers for common server-side Supabase queries.
 *
 * React.cache() deduplicates calls within a single server render request,
 * so next-intl.config.ts and dashboard layout share the same results without
 * making redundant round-trips to Supabase.
 */
import { cache } from 'react'
import { createClient } from './server'

/** Cached auth.getUser() — one network call per request, no matter how many callers. */
export const getServerUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user: error ? null : user }
})

/**
 * Cached user profile + active business locale — one DB call per request.
 * Returns null if not authenticated or profile not found.
 */
export const getServerUserProfile = cache(async () => {
  const { user } = await getServerUser()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return data ?? null
})

/**
 * Cached active business + all memberships — one pair of DB calls per request.
 * Returns null if user has no business.
 */
export const getServerBusiness = cache(async (activeBizId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', activeBizId)
    .single()
  return data ?? null
})
