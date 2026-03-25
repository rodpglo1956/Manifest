// GET /api/billing/status
// Returns current billing account, plan limits, and usage for the org
// Response: { account, limits, usage }

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { BillingAccount, PlanLimits, UsageRecord } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()

  // Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get org context
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 })
  }

  // Get billing account
  const { data: accountData, error: accountError } = await supabase
    .from('billing_accounts')
    .select('*')
    .eq('org_id', profile.org_id)
    .single()

  if (accountError || !accountData) {
    return NextResponse.json(
      { error: 'Billing account not found' },
      { status: 404 }
    )
  }

  const account = accountData as unknown as BillingAccount

  // Get plan limits for current plan
  const { data: limitsData } = await supabase
    .from('plan_limits')
    .select('*')
    .eq('plan', account.plan)
    .single()

  const limits = limitsData as unknown as PlanLimits | null

  // Get current period usage
  const today = new Date().toISOString().split('T')[0]
  const { data: usageData } = await supabase
    .from('usage_records')
    .select('*')
    .eq('org_id', profile.org_id)
    .lte('period_start', today)
    .gte('period_end', today)
    .order('period_start', { ascending: false })
    .limit(1)
    .maybeSingle()

  const usage = usageData as unknown as UsageRecord | null

  return NextResponse.json({
    account,
    limits: limits || null,
    usage: usage || null,
  })
}
