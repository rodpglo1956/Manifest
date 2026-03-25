import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getFleetCostSummary, getUpcomingMaintenance } from '@/lib/fleet/actions'
import { FleetDashboard } from '@/components/fleet/fleet-dashboard'
import type { Metadata } from 'next'
import type { VehicleStatus } from '@/types/database'

export const metadata: Metadata = {
  title: 'Fleet Dashboard | Manifest',
}

export default async function FleetDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) redirect('/onboarding')

  // Fetch vehicle status counts
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, status')
    .eq('org_id', profile.org_id)

  const statusCounts: Record<string, number> = {}
  let totalCount = 0
  for (const v of vehicles ?? []) {
    statusCounts[v.status] = (statusCounts[v.status] || 0) + 1
    totalCount++
  }

  // Fetch cost summary and upcoming maintenance in parallel
  const [costResult, maintenanceResult] = await Promise.all([
    getFleetCostSummary(),
    getUpcomingMaintenance(),
  ])

  return (
    <FleetDashboard
      statusCounts={{
        active: statusCounts['active'] ?? 0,
        in_shop: statusCounts['in_shop'] ?? 0,
        out_of_service: statusCounts['out_of_service'] ?? 0,
        parked: statusCounts['parked'] ?? 0,
        total: totalCount,
      }}
      costSummary={costResult.data ?? {
        fleetCostPerMile: 0,
        topExpensiveVehicles: [],
        totalMaintenanceCosts: 0,
        totalFuelCosts: 0,
      }}
      upcomingMaintenance={maintenanceResult.data ?? []}
    />
  )
}
