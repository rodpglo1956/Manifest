// Billing enforcement middleware
// Checks plan limits before resource creation, throws UsageLimitError (402) when exceeded
// Uses supabaseAdmin for server-side enforcement queries

import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { PLAN_CONFIG } from '@/lib/billing/plans'
import type { BillingPlan } from '@/types/database'

export class UsageLimitError extends Error {
  public statusCode = 402
  public plan: string
  public resource: string
  public current: number
  public limit: number

  constructor(resource: string, current: number, limit: number, plan: string) {
    super(`${resource} limit reached (${current}/${limit}) on ${plan} plan`)
    this.name = 'UsageLimitError'
    this.resource = resource
    this.current = current
    this.limit = limit
    this.plan = plan
  }
}

export type UsageResource = 'vehicles' | 'drivers' | 'loads' | 'users' | 'ai_queries'

/**
 * Map a UsageResource to the corresponding plan_limits column name
 */
function resourceToLimitColumn(resource: UsageResource): string {
  const map: Record<UsageResource, string> = {
    vehicles: 'max_vehicles',
    drivers: 'max_drivers',
    loads: 'max_loads_per_month',
    users: 'max_users',
    ai_queries: 'ai_queries_per_month',
  }
  return map[resource]
}

/**
 * Check if the org has exceeded the plan limit for a given resource.
 * Throws UsageLimitError if at or over the limit.
 * Does NOT throw for enterprise plans or unlimited (-1) resources.
 */
export async function checkUsageLimit(
  orgId: string,
  resource: UsageResource
): Promise<void> {
  const admin = getSupabaseAdmin()

  // Get the org's billing account to determine current plan
  const { data: account } = await admin
    .from('billing_accounts')
    .select('plan, current_period_start, current_period_end')
    .eq('org_id', orgId)
    .single()

  if (!account) {
    // No billing account means they haven't been set up yet -- allow operation
    return
  }

  const plan = account.plan as BillingPlan

  // Enterprise plans are unlimited
  if (plan === 'enterprise') return

  // Get plan limits from the plan_limits reference table
  const { data: limits } = await admin
    .from('plan_limits')
    .select('*')
    .eq('plan', plan)
    .single()

  if (!limits) return // No limits defined -- allow

  const limitColumn = resourceToLimitColumn(resource)
  const maxAllowed = limits[limitColumn as keyof typeof limits] as number

  // -1 means unlimited
  if (maxAllowed === -1) return

  // Count current usage based on resource type
  let currentCount = 0

  switch (resource) {
    case 'vehicles': {
      const { count } = await admin
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .neq('status', 'sold')
      currentCount = count ?? 0
      break
    }
    case 'drivers': {
      const { count } = await admin
        .from('drivers')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'active')
      currentCount = count ?? 0
      break
    }
    case 'loads': {
      // Count loads in the current billing period
      const periodStart = account.current_period_start || new Date().toISOString()
      const { count } = await admin
        .from('loads')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', periodStart)
      currentCount = count ?? 0
      break
    }
    case 'users': {
      const { count } = await admin
        .from('org_members')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
      currentCount = count ?? 0
      break
    }
    case 'ai_queries': {
      // Count AI queries in the current billing period
      const periodStart = account.current_period_start || new Date().toISOString()
      const { count } = await admin
        .from('marie_queries')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', periodStart)
      currentCount = count ?? 0
      break
    }
  }

  if (currentCount >= maxAllowed) {
    throw new UsageLimitError(resource, currentCount, maxAllowed, plan)
  }
}

/**
 * Get a summary of current usage vs limits for all resources.
 * Used by the billing status UI to show usage meters.
 */
export async function getUsageSummary(
  orgId: string
): Promise<Record<UsageResource, { current: number; limit: number; percentage: number }>> {
  const admin = getSupabaseAdmin()

  // Get the org's billing account
  const { data: account } = await admin
    .from('billing_accounts')
    .select('plan, current_period_start, current_period_end')
    .eq('org_id', orgId)
    .single()

  const plan = (account?.plan ?? 'free') as BillingPlan
  const config = PLAN_CONFIG[plan]

  const periodStart = account?.current_period_start || new Date().toISOString()

  // Count all resources in parallel
  const [vehiclesRes, driversRes, loadsRes, usersRes, aiRes] = await Promise.all([
    admin
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .neq('status', 'sold'),
    admin
      .from('drivers')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'active'),
    admin
      .from('loads')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('created_at', periodStart),
    admin
      .from('org_members')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId),
    admin
      .from('marie_queries')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('created_at', periodStart),
  ])

  function buildEntry(current: number, limit: number) {
    const effectiveLimit = limit === -1 ? Infinity : limit
    const percentage = effectiveLimit === Infinity ? 0 : Math.round((current / effectiveLimit) * 100)
    return { current, limit, percentage }
  }

  return {
    vehicles: buildEntry(vehiclesRes.count ?? 0, config.limits.vehicles),
    drivers: buildEntry(driversRes.count ?? 0, config.limits.drivers),
    loads: buildEntry(loadsRes.count ?? 0, config.limits.loadsPerMonth),
    users: buildEntry(usersRes.count ?? 0, config.limits.users),
    ai_queries: buildEntry(aiRes.count ?? 0, config.limits.aiQueriesPerMonth),
  }
}

/**
 * Check if the org's plan includes a specific module.
 * Returns boolean -- does NOT throw. UI should gate module visibility.
 */
export async function checkModuleAccess(
  orgId: string,
  module: 'compliance' | 'ifta' | 'crm' | 'ai'
): Promise<boolean> {
  const admin = getSupabaseAdmin()

  const { data: account } = await admin
    .from('billing_accounts')
    .select('plan')
    .eq('org_id', orgId)
    .single()

  if (!account) return false

  const plan = account.plan as BillingPlan
  return PLAN_CONFIG[plan].modules[module]
}
