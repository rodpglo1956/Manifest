'use server'

import { createClient } from '@/lib/supabase/server'
import type { AnalyticsSnapshot, DriverPerformance } from '@/types/database'

// ============================================================
// Auth + Org helper (per Phase 8 convention)
// ============================================================

async function getAuthContext() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' as const, supabase, user: null, orgId: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) {
    return { error: 'No organization found' as const, supabase, user, orgId: null }
  }

  return { error: null, supabase, user, orgId: profile.org_id }
}

// ============================================================
// Period date range helpers
// ============================================================

function getPeriodRange(period: 'week' | 'month' | 'quarter'): {
  currentStart: string
  currentEnd: string
  previousStart: string
  previousEnd: string
} {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  if (period === 'week') {
    const dayOfWeek = now.getDay() || 7
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - dayOfWeek + 1)
    const prevWeekEnd = new Date(weekStart)
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 1)
    const prevWeekStart = new Date(prevWeekEnd)
    prevWeekStart.setDate(prevWeekStart.getDate() - 6)
    return {
      currentStart: weekStart.toISOString().slice(0, 10),
      currentEnd: today,
      previousStart: prevWeekStart.toISOString().slice(0, 10),
      previousEnd: prevWeekEnd.toISOString().slice(0, 10),
    }
  }

  if (period === 'month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const prevMonthEnd = new Date(monthStart)
    prevMonthEnd.setDate(prevMonthEnd.getDate() - 1)
    const prevMonthStart = new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), 1)
    return {
      currentStart: monthStart.toISOString().slice(0, 10),
      currentEnd: today,
      previousStart: prevMonthStart.toISOString().slice(0, 10),
      previousEnd: prevMonthEnd.toISOString().slice(0, 10),
    }
  }

  // quarter
  const currentQuarter = Math.floor(now.getMonth() / 3)
  const qStart = new Date(now.getFullYear(), currentQuarter * 3, 1)
  const prevQEnd = new Date(qStart)
  prevQEnd.setDate(prevQEnd.getDate() - 1)
  const prevQStart = new Date(prevQEnd.getFullYear(), Math.floor(prevQEnd.getMonth() / 3) * 3, 1)
  return {
    currentStart: qStart.toISOString().slice(0, 10),
    currentEnd: today,
    previousStart: prevQStart.toISOString().slice(0, 10),
    previousEnd: prevQEnd.toISOString().slice(0, 10),
  }
}

function getExtendedPeriodRange(period: 'month' | 'quarter' | 'year'): {
  start: string
  end: string
} {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { start: start.toISOString().slice(0, 10), end: today }
  }

  if (period === 'quarter') {
    const currentQuarter = Math.floor(now.getMonth() / 3)
    const start = new Date(now.getFullYear(), currentQuarter * 3, 1)
    return { start: start.toISOString().slice(0, 10), end: today }
  }

  // year
  const start = new Date(now.getFullYear(), 0, 1)
  return { start: start.toISOString().slice(0, 10), end: today }
}

// ============================================================
// KPI Summary type
// ============================================================

export type KpiSummary = {
  revenue: { value: number; change: number; changePercent: number }
  expenses: { value: number; change: number; changePercent: number }
  profit: { value: number; change: number; changePercent: number }
  rpm: { value: number; change: number; changePercent: number }
  cpm: { value: number; change: number; changePercent: number }
  profitPerMile: { value: number; change: number; changePercent: number }
  fleetUtil: { value: number | null; change: number; changePercent: number }
  onTimePct: { value: number; change: number; changePercent: number }
  complianceScore: { value: number | null; change: number; changePercent: number }
}

type MetricComparison = { value: number; change: number; changePercent: number }

function compareMetric(
  current: AnalyticsSnapshot[],
  previous: AnalyticsSnapshot[],
  extractor: (s: AnalyticsSnapshot) => number | null,
  aggregator: 'sum' | 'avg' = 'sum'
): MetricComparison {
  const aggregate = (snaps: AnalyticsSnapshot[]): number => {
    const values = snaps.map(extractor).filter((v): v is number => v !== null)
    if (values.length === 0) return 0
    if (aggregator === 'avg') return values.reduce((a, b) => a + b, 0) / values.length
    return values.reduce((a, b) => a + b, 0)
  }

  const currentValue = aggregate(current)
  const previousValue = aggregate(previous)
  const change = currentValue - previousValue
  const changePercent = previousValue !== 0
    ? Math.round((change / previousValue) * 1000) / 10
    : currentValue > 0 ? 100 : 0

  return { value: Math.round(currentValue * 100) / 100, change: Math.round(change * 100) / 100, changePercent }
}

// ============================================================
// Server Actions
// ============================================================

/**
 * Get analytics dashboard KPI summary with period comparison.
 */
export async function getAnalyticsDashboard(period: 'week' | 'month' | 'quarter'): Promise<{
  error: string | null
  kpis: KpiSummary | null
  currentSnapshots: AnalyticsSnapshot[]
}> {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error, kpis: null, currentSnapshots: [] }

  const { currentStart, currentEnd, previousStart, previousEnd } = getPeriodRange(period)

  const [currentRes, previousRes] = await Promise.all([
    supabase
      .from('daily_snapshots')
      .select('*')
      .eq('org_id', orgId)
      .eq('period', 'daily')
      .gte('snapshot_date', currentStart)
      .lte('snapshot_date', currentEnd)
      .order('snapshot_date', { ascending: true }),
    supabase
      .from('daily_snapshots')
      .select('*')
      .eq('org_id', orgId)
      .eq('period', 'daily')
      .gte('snapshot_date', previousStart)
      .lte('snapshot_date', previousEnd)
      .order('snapshot_date', { ascending: true }),
  ])

  const current = (currentRes.data ?? []) as AnalyticsSnapshot[]
  const previous = (previousRes.data ?? []) as AnalyticsSnapshot[]

  const kpis: KpiSummary = {
    revenue: compareMetric(current, previous, s => s.revenue),
    expenses: compareMetric(current, previous, s => s.total_expenses),
    profit: compareMetric(current, previous, s => s.net_profit),
    rpm: compareMetric(current, previous, s => s.revenue_per_mile, 'avg'),
    cpm: compareMetric(current, previous, s => s.cost_per_mile, 'avg'),
    profitPerMile: compareMetric(current, previous, s => s.profit_per_mile, 'avg'),
    fleetUtil: compareMetric(current, previous, s => s.fleet_utilization_pct, 'avg'),
    onTimePct: compareMetric(current, previous, s => s.on_time_percentage, 'avg'),
    complianceScore: compareMetric(current, previous, s => s.compliance_score, 'avg'),
  }

  return { error: null, kpis, currentSnapshots: current }
}

/**
 * Get operations analytics: load volume, miles, on-time trending, top lanes.
 */
export async function getOperationsAnalytics(period: 'week' | 'month' | 'quarter'): Promise<{
  error: string | null
  snapshots: AnalyticsSnapshot[]
  topLanes: { origin: string; destination: string; revenue: number; loads: number }[]
}> {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error, snapshots: [], topLanes: [] }

  const { currentStart, currentEnd } = getPeriodRange(period)

  const [snapshotRes, lanesRes] = await Promise.all([
    supabase
      .from('daily_snapshots')
      .select('*')
      .eq('org_id', orgId)
      .eq('period', 'daily')
      .gte('snapshot_date', currentStart)
      .lte('snapshot_date', currentEnd)
      .order('snapshot_date', { ascending: true }),
    supabase
      .from('loads')
      .select('pickup_city, pickup_state, delivery_city, delivery_state, total_charges')
      .eq('org_id', orgId)
      .in('status', ['delivered', 'invoiced', 'paid'])
      .gte('created_at', `${currentStart}T00:00:00Z`)
      .lte('created_at', `${currentEnd}T23:59:59Z`)
      .not('pickup_city', 'is', null)
      .not('delivery_city', 'is', null),
  ])

  const snapshots = (snapshotRes.data ?? []) as AnalyticsSnapshot[]

  // Aggregate top lanes by revenue
  const laneMap = new Map<string, { revenue: number; loads: number; origin: string; destination: string }>()
  for (const load of lanesRes.data ?? []) {
    const origin = `${load.pickup_city}, ${load.pickup_state}`
    const destination = `${load.delivery_city}, ${load.delivery_state}`
    const key = `${origin}::${destination}`
    const existing = laneMap.get(key) ?? { revenue: 0, loads: 0, origin, destination }
    existing.revenue += load.total_charges ?? 0
    existing.loads += 1
    laneMap.set(key, existing)
  }

  const topLanes = Array.from(laneMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  return { error: null, snapshots, topLanes }
}

/**
 * Get fleet analytics: utilization, MPG, maintenance, fuel cost trending.
 */
export async function getFleetAnalytics(period: 'week' | 'month' | 'quarter'): Promise<{
  error: string | null
  snapshots: AnalyticsSnapshot[]
  vehicleCosts: { vehicle_id: string; unit_number: string; fuel: number; maintenance: number; total: number }[]
}> {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error, snapshots: [], vehicleCosts: [] }

  const { currentStart, currentEnd } = getPeriodRange(period)

  const [snapshotRes, fuelRes, maintRes, vehiclesRes] = await Promise.all([
    supabase
      .from('daily_snapshots')
      .select('*')
      .eq('org_id', orgId)
      .eq('period', 'daily')
      .gte('snapshot_date', currentStart)
      .lte('snapshot_date', currentEnd)
      .order('snapshot_date', { ascending: true }),
    supabase
      .from('fuel_transactions')
      .select('vehicle_id, total_cost')
      .eq('org_id', orgId)
      .gte('transaction_date', `${currentStart}T00:00:00Z`)
      .lte('transaction_date', `${currentEnd}T23:59:59Z`),
    supabase
      .from('maintenance_records')
      .select('vehicle_id, cost_total')
      .eq('org_id', orgId)
      .gte('date_in', `${currentStart}T00:00:00Z`)
      .lte('date_in', `${currentEnd}T23:59:59Z`),
    supabase
      .from('vehicles')
      .select('id, unit_number')
      .eq('org_id', orgId),
  ])

  const snapshots = (snapshotRes.data ?? []) as AnalyticsSnapshot[]

  // Build vehicle cost map
  const vehicleNames = new Map<string, string>()
  for (const v of vehiclesRes.data ?? []) {
    vehicleNames.set(v.id, v.unit_number)
  }

  const costMap = new Map<string, { fuel: number; maintenance: number }>()
  for (const ft of fuelRes.data ?? []) {
    const existing = costMap.get(ft.vehicle_id) ?? { fuel: 0, maintenance: 0 }
    existing.fuel += ft.total_cost
    costMap.set(ft.vehicle_id, existing)
  }
  for (const mr of maintRes.data ?? []) {
    const existing = costMap.get(mr.vehicle_id) ?? { fuel: 0, maintenance: 0 }
    existing.maintenance += mr.cost_total
    costMap.set(mr.vehicle_id, existing)
  }

  const vehicleCosts = Array.from(costMap.entries())
    .map(([vehicleId, costs]) => ({
      vehicle_id: vehicleId,
      unit_number: vehicleNames.get(vehicleId) ?? vehicleId,
      fuel: Math.round(costs.fuel * 100) / 100,
      maintenance: Math.round(costs.maintenance * 100) / 100,
      total: Math.round((costs.fuel + costs.maintenance) * 100) / 100,
    }))
    .sort((a, b) => b.total - a.total)

  return { error: null, snapshots, vehicleCosts }
}

/**
 * Get driver performance scorecards.
 */
export async function getDriverPerformance(period: 'month' | 'quarter' | 'year'): Promise<{
  error: string | null
  drivers: (DriverPerformance & { driver_name: string })[]
}> {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error, drivers: [] }

  const { start, end } = getExtendedPeriodRange(period)

  const [perfRes, driversRes] = await Promise.all([
    supabase
      .from('driver_performance')
      .select('*')
      .eq('org_id', orgId)
      .gte('period_start', start)
      .lte('period_start', end)
      .order('revenue_generated', { ascending: false }),
    supabase
      .from('drivers')
      .select('id, first_name, last_name')
      .eq('org_id', orgId),
  ])

  const driverNames = new Map<string, string>()
  for (const d of driversRes.data ?? []) {
    driverNames.set(d.id, `${d.first_name} ${d.last_name}`)
  }

  // Aggregate by driver across the period
  const driverMap = new Map<string, DriverPerformance & { driver_name: string }>()
  for (const perf of (perfRes.data ?? []) as DriverPerformance[]) {
    const existing = driverMap.get(perf.driver_id)
    if (!existing) {
      driverMap.set(perf.driver_id, {
        ...perf,
        driver_name: driverNames.get(perf.driver_id) ?? 'Unknown',
      })
    } else {
      existing.loads_completed += perf.loads_completed
      existing.miles_driven += perf.miles_driven
      existing.revenue_generated += perf.revenue_generated
      existing.safety_incidents += perf.safety_incidents
      existing.customer_complaints += perf.customer_complaints
      // Average on-time and fuel efficiency
      if (perf.on_time_pct !== null && existing.on_time_pct !== null) {
        existing.on_time_pct = Math.round(((existing.on_time_pct + perf.on_time_pct) / 2) * 100) / 100
      }
      if (perf.fuel_efficiency !== null && existing.fuel_efficiency !== null) {
        existing.fuel_efficiency = Math.round(((existing.fuel_efficiency + perf.fuel_efficiency) / 2) * 100) / 100
      }
      if (perf.compliance_score !== null && existing.compliance_score !== null) {
        existing.compliance_score = Math.round((existing.compliance_score + perf.compliance_score) / 2)
      }
    }
  }

  const drivers = Array.from(driverMap.values())
    .sort((a, b) => b.revenue_generated - a.revenue_generated)

  return { error: null, drivers }
}

/**
 * Get customer analytics: revenue ranking, avg days to pay, load counts.
 */
export async function getCustomerAnalytics(): Promise<{
  error: string | null
  customers: {
    id: string
    name: string
    total_revenue: number
    total_loads: number
    avg_days_to_pay: number | null
    status: string
  }[]
}> {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error, customers: [] }

  const { data } = await supabase
    .from('crm_companies')
    .select('id, name, total_revenue, total_loads, days_to_pay, status')
    .eq('org_id', orgId)
    .order('total_revenue', { ascending: false })
    .limit(50)

  const customers = (data ?? []).map(c => ({
    id: c.id,
    name: c.name,
    total_revenue: c.total_revenue,
    total_loads: c.total_loads,
    avg_days_to_pay: c.days_to_pay,
    status: c.status,
  }))

  return { error: null, customers }
}
