import { createAdminClient } from '@/lib/supabase/admin'

export async function getClientProfile(businessId: string): Promise<string> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('businesses')
    .select('name, industry, country_code, locale, ai_context')
    .eq('id', businessId)
    .single()

  if (!data) return 'Business context: not available'

  return [
    `Business name: ${data.name}`,
    `Industry: ${data.industry ?? 'Not specified'}`,
    `Country: ${data.country_code}`,
    `Language: ${data.locale}`,
    `Additional context: ${data.ai_context ?? 'None provided'}`,
  ].join('\n')
}
