import { getRequestConfig } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'

const SUPPORTED_LOCALES = ['en', 'fr', 'de', 'es', 'it', 'nl'] as const
type SupportedLocale = typeof SUPPORTED_LOCALES[number]

function isSupported(l: string): l is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(l)
}

export default getRequestConfig(async () => {
  let locale: SupportedLocale = 'en'

  try {
    // Read locale from businesses table (source of truth).
    // Dashboard layout already fetches business, but next-intl config runs
    // before any layout, so we do a lightweight single-column fetch here.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Get business_id from users, then locale from businesses
      const { data: userRow } = await supabase
        .from('users')
        .select('business_id')
        .eq('id', user.id)
        .single()

      if (userRow?.business_id) {
        const { data: biz } = await supabase
          .from('businesses')
          .select('locale')
          .eq('id', userRow.business_id)
          .single()

        if (biz?.locale && isSupported(biz.locale)) {
          locale = biz.locale
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
