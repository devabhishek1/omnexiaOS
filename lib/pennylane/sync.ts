import { createAdminClient } from '@/lib/supabase/admin'
import { encrypt, decrypt } from '@/lib/utils/crypto'
import { pennylaneRequest } from './client'

interface PennylaneInvoice {
  id: string | number
  customer?: { name?: string; email?: string }
  amount: string
  status: string
  due_date?: string
  date?: string
  currency?: string
}

function mapPennylaneStatus(status: string): string {
  const map: Record<string, string> = {
    paid: 'paid',
    draft: 'unpaid',
    not_paid: 'unpaid',
    late: 'overdue',
  }
  return map[status] ?? 'unpaid'
}

export async function syncPennylaneInvoices(businessId: string): Promise<{ synced: number }> {
  const admin = createAdminClient()

  const { data: integration, error } = await admin
    .from('integrations')
    .select('access_token, refresh_token')
    .eq('business_id', businessId)
    .eq('provider', 'pennylane')
    .single()

  if (error || !integration?.access_token) {
    throw new Error('No Pennylane integration found for this business')
  }

  const accessToken = decrypt(integration.access_token)

  const response = await pennylaneRequest<{ invoices: PennylaneInvoice[] }>(
    '/customer_invoices',
    accessToken
  )

  const invoices = response.invoices ?? []
  let synced = 0

  for (const inv of invoices) {
    const { error: upsertError } = await admin.from('invoices').upsert(
      {
        business_id: businessId,
        client_name: inv.customer?.name ?? 'Unknown',
        client_email: inv.customer?.email ?? null,
        line_items: [],
        subtotal: parseFloat(inv.amount ?? '0'),
        vat_rate: 0,
        vat_amount: 0,
        total: parseFloat(inv.amount ?? '0'),
        status: mapPennylaneStatus(inv.status),
        due_date: inv.due_date ?? null,
        issued_date: inv.date ?? null,
        source: 'pennylane',
        external_id: inv.id.toString(),
        currency: inv.currency ?? 'EUR',
      },
      { onConflict: 'external_id,source' }
    )

    if (!upsertError) synced++
  }

  // Update last_synced_at
  await admin
    .from('integrations')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('business_id', businessId)
    .eq('provider', 'pennylane')

  return { synced }
}

export async function storePennylaneTokens(
  businessId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
) {
  const admin = createAdminClient()
  await admin.from('integrations').upsert(
    {
      business_id: businessId,
      provider: 'pennylane',
      access_token: encrypt(accessToken),
      refresh_token: encrypt(refreshToken),
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      status: 'connected',
    },
    { onConflict: 'business_id,provider' }
  )
}
