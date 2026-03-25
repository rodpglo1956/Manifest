import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getUsageSummary } from '@/lib/billing/enforce'
import { BillingContent } from './billing-content'
import type { BillingAccount, BillingInvoice } from '@/types/database'

export const metadata: Metadata = {
  title: 'Billing | Manifest',
}

export default async function BillingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get org_id from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) {
    redirect('/onboarding')
  }

  const orgId = profile.org_id

  // Load billing data in parallel
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
      .limit(20),
    getUsageSummary(orgId),
  ])

  const account = (accountResult.data as BillingAccount | null) ?? null
  const invoices = (invoicesResult.data as BillingInvoice[] | null) ?? []

  return (
    <div className="max-w-4xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Billing</h2>
      <p className="text-sm text-gray-500 mb-6">
        Manage your plan, usage, and billing details.
      </p>
      <BillingContent account={account} usage={usage} invoices={invoices} />
    </div>
  )
}
