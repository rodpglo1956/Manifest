import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { startOfMonth, startOfToday, format } from 'date-fns'
import { DashboardView } from './dashboard-view'
import type { ActivityItem } from './activity-feed'
import type { DailySnapshot, ProactiveAlert } from '@/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | Manifest',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, org_id')
    .eq('id', user.id)
    .single()

  const orgId = profile?.org_id
  if (!orgId) {
    redirect('/onboarding')
  }

  // Detect Owner-Operator: single-admin org member
  const { count: memberCount } = await supabase
    .from('org_members')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)

  const isOwnerOperator = (memberCount ?? 0) === 1 && profile?.full_name !== null

  // If Owner-Operator, get their linked driver record
  let ownerDriverId: string | null = null
  if (isOwnerOperator) {
    const { data: driver } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', user.id)
      .single()
    ownerDriverId = driver?.id ?? null
  }

  const todayStr = format(startOfToday(), 'yyyy-MM-dd\'T\'HH:mm:ss')
  const monthStartStr = format(startOfMonth(new Date()), 'yyyy-MM-dd')

  // Build queries with optional Owner-Operator scoping
  const activeLoadsQuery = supabase
    .from('loads')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'in_transit')
  if (ownerDriverId) activeLoadsQuery.eq('driver_id', ownerDriverId)

  const bookedTodayQuery = supabase
    .from('loads')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', todayStr)
  if (ownerDriverId) bookedTodayQuery.eq('driver_id', ownerDriverId)

  const driversOnDutyQuery = ownerDriverId
    ? supabase
        .from('drivers')
        .select('id', { count: 'exact', head: true })
        .eq('id', ownerDriverId)
        .eq('status', 'active')
        .not('current_vehicle_id', 'is', null)
    : supabase
        .from('drivers')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .not('current_vehicle_id', 'is', null)

  const revenueMtdQuery = supabase
    .from('loads')
    .select('total_charges')
    .in('status', ['delivered', 'invoiced', 'paid'])
    .gte('delivery_date', monthStartStr)
  if (ownerDriverId) revenueMtdQuery.eq('driver_id', ownerDriverId)

  // Analytics snapshots query (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const snapshotStartDate = thirtyDaysAgo.toISOString().split('T')[0]

  const snapshotsQuery = supabase
    .from('daily_snapshots')
    .select('*')
    .eq('org_id', orgId)
    .gte('snapshot_date', snapshotStartDate)
    .order('snapshot_date', { ascending: true })

  // Fetch unacknowledged alerts
  const alertsQuery = supabase
    .from('proactive_alerts')
    .select('*')
    .eq('acknowledged', false)
    .order('created_at', { ascending: false })
    .limit(20)

  // Activity feed queries -- use type-safe selects without relational joins
  // (Database type doesn't define Relationships)
  const statusHistoryQuery = supabase
    .from('load_status_history')
    .select('id, load_id, old_status, new_status, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  const dispatchesQuery = supabase
    .from('dispatches')
    .select('id, load_id, driver_id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const invoicesQuery = supabase
    .from('invoices')
    .select('id, invoice_number, total, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  // Run all queries in parallel
  const [
    activeLoads,
    bookedToday,
    driversOnDuty,
    revenueMtdResult,
    alertsResult,
    snapshotsResult,
    statusChanges,
    recentDispatches,
    recentInvoices,
  ] = await Promise.all([
    activeLoadsQuery,
    bookedTodayQuery,
    driversOnDutyQuery,
    revenueMtdQuery,
    alertsQuery,
    snapshotsQuery,
    statusHistoryQuery,
    dispatchesQuery,
    invoicesQuery,
  ])

  // Calculate revenue MTD
  const totalRevenue = (revenueMtdResult.data ?? []).reduce(
    (sum, load) => sum + (load.total_charges ?? 0),
    0
  )

  // Fetch load numbers and driver names for activity descriptions
  const activityLoadIds = [
    ...(statusChanges.data ?? []).map((c) => c.load_id),
    ...(recentDispatches.data ?? []).map((d) => d.load_id),
  ].filter(Boolean)

  const activityDriverIds = (recentDispatches.data ?? []).map((d) => d.driver_id).filter(Boolean)

  const [loadNumbers, driverNames] = await Promise.all([
    activityLoadIds.length > 0
      ? supabase.from('loads').select('id, load_number').in('id', activityLoadIds)
      : { data: [] as { id: string; load_number: string | null }[] },
    activityDriverIds.length > 0
      ? supabase.from('drivers').select('id, first_name, last_name').in('id', activityDriverIds)
      : { data: [] as { id: string; first_name: string; last_name: string }[] },
  ])

  const loadNumMap = new Map(
    (loadNumbers.data ?? []).map((l) => [l.id, l.load_number ?? l.id.slice(0, 8)])
  )
  const driverNameMap = new Map(
    (driverNames.data ?? []).map((d) => [d.id, `${d.first_name} ${d.last_name}`])
  )

  // Build activity items
  const activityItems: ActivityItem[] = []

  // Status changes
  for (const change of statusChanges.data ?? []) {
    const loadNum = loadNumMap.get(change.load_id) ?? change.load_id.slice(0, 8)
    activityItems.push({
      id: `status-${change.id}`,
      type: 'status_change',
      description: `Load ${loadNum}: ${change.old_status ?? 'new'} -> ${change.new_status}`,
      timestamp: change.created_at,
      link: `/loads/${change.load_id}`,
    })
  }

  // Dispatches
  for (const dispatch of recentDispatches.data ?? []) {
    const loadNum = loadNumMap.get(dispatch.load_id) ?? dispatch.load_id.slice(0, 8)
    const driverName = driverNameMap.get(dispatch.driver_id) ?? 'Unknown'
    activityItems.push({
      id: `dispatch-${dispatch.id}`,
      type: 'dispatch',
      description: `${driverName} ${dispatch.status} for load ${loadNum}`,
      timestamp: dispatch.created_at,
      link: `/dispatch`,
    })
  }

  // Invoices
  for (const invoice of recentInvoices.data ?? []) {
    activityItems.push({
      id: `invoice-${invoice.id}`,
      type: 'invoice',
      description: `Invoice ${invoice.invoice_number} (${invoice.status}) - $${invoice.total.toLocaleString()}`,
      timestamp: invoice.created_at,
      link: `/invoices/${invoice.id}`,
    })
  }

  // Sort by timestamp descending
  activityItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <DashboardView
      orgId={orgId}
      activeLoads={activeLoads.count ?? 0}
      bookedToday={bookedToday.count ?? 0}
      driversOnDuty={driversOnDuty.count ?? 0}
      revenueMtd={totalRevenue}
      alerts={(alertsResult.data ?? []) as ProactiveAlert[]}
      snapshots={(snapshotsResult.data ?? []) as DailySnapshot[]}
      activityItems={activityItems}
      isOwnerOperator={isOwnerOperator}
      userName={profile?.full_name ?? undefined}
    />
  )
}
