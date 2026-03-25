import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PlanComparison } from './plan-comparison'
import type { BillingAccount, BillingPlan } from '@/types/database'

export const metadata: Metadata = {
  title: 'Plans | Manifest',
}

export default async function PlansPage() {
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

  const { data: accountData } = await supabase
    .from('billing_accounts')
    .select('plan')
    .eq('org_id', profile.org_id)
    .single()

  const currentPlan: BillingPlan = (accountData as Pick<BillingAccount, 'plan'> | null)?.plan ?? 'free'

  return (
    <div className="max-w-5xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Plans</h2>
      <p className="text-sm text-gray-500 mb-6">
        Compare plans and choose the best fit for your operation.
      </p>
      <PlanComparison currentPlan={currentPlan} />
    </div>
  )
}
