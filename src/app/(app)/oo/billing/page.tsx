import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getUsageSummary } from '@/lib/billing/enforce'
import { BillingContent } from '@/app/(app)/settings/billing/billing-content'
import type { BillingAccount, BillingInvoice } from '@/types/database'

export const metadata: Metadata = {
  title: 'Billing | Manifest',
}

export default async function OOBillingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) {
    redirect('/onboarding')
  }

  const orgId = profile.org_id

  const [accountResult, invoicesResult, usage] = await Promise.all([
    supabase
      .from('billing_accounts')
      .select('*')
      .eq('org_id', orgId)
      .single(),
    supabase
      .from('billing_invoices')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(5),
    getUsageSummary(orgId),
  ])

  const account = (accountResult.data as BillingAccount | null) ?? null
  const invoices = (invoicesResult.data as BillingInvoice[] | null) ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Billing</h1>
      <p className="text-sm text-gray-500">Your plan and usage overview.</p>
      <BillingContent account={account} usage={usage} invoices={invoices} simplified />
    </div>
  )
}
