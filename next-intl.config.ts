import { getRequestConfig } from 'next-intl/server'
import { getServerUser, getServerUserProfile } from '@/lib/supabase/request-cache'

const SUPPORTED_LOCALES = ['en', 'fr', 'de', 'es', 'it', 'nl'] as const
type SupportedLocale = typeof SUPPORTED_LOCALES[number]

function isSupported(l: string): l is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(l)
}

export default getRequestConfig(async () => {
  let locale: SupportedLocale = 'en'

  try {
    // getServerUser/getServerUserProfile are React.cache()-wrapped — if the
    // dashboard layout has already called them in the same request, these
    // return the cached result with zero extra network calls.
    const { user } = await getServerUser()

    if (user) {
      const userProfile = await getServerUserProfile()

      if (userProfile) {
        const bizId = userProfile.active_business_id ?? userProfile.business_id

        if (bizId) {
          // Single targeted query — only locale column
          const { createClient } = await import('@/lib/supabase/server')
          const supabase = await createClient()
          const { data: biz } = await supabase
            .from('businesses')
            .select('locale')
            .eq('id', bizId)
            .single()

          if (biz?.locale && isSupported(biz.locale)) {
            locale = biz.locale
          }
        }
      }
    }
  } catch {
    // Not authenticated (login page, etc.) — fall back to 'en'
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
