import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getFuelTransactions, getFleetCostSummary } from '@/lib/fleet/actions'
import { FuelDashboard } from '@/components/fleet/fuel-dashboard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fuel Dashboard | Manifest',
}

export default async function FuelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) redirect('/onboarding')

  // Fetch vehicles and drivers for selectors
  const [vehiclesResult, driversResult] = await Promise.all([
    supabase
      .from('vehicles')
      .select('id, unit_number, avg_mpg, current_odometer')
      .eq('org_id', profile.org_id)
      .order('unit_number', { ascending: true }),
    supabase
      .from('drivers')
      .select('id, first_name, last_name')
      .eq('org_id', profile.org_id)
      .eq('status', 'active')
      .order('last_name', { ascending: true }),
  ])

  // Fetch fuel transactions (last 90 days)
  const fuelResult = await getFuelTransactions()
  const costResult = await getFleetCostSummary()

  // Calculate fleet avg MPG
  const vehiclesWithMpg = (vehiclesResult.data ?? []).filter(
    (v) => v.avg_mpg != null && v.avg_mpg > 0
  )
  const fleetAvgMpg =
    vehiclesWithMpg.length > 0
      ? vehiclesWithMpg.reduce((sum, v) => sum + (v.avg_mpg ?? 0), 0) /
        vehiclesWithMpg.length
      : 0

  return (
    <FuelDashboard
      transactions={fuelResult.data ?? []}
      vehicles={vehiclesResult.data ?? []}
      drivers={(driversResult.data ?? []).map((d) => ({
        id: d.id,
        name: `${d.first_name} ${d.last_name}`,
      }))}
      fleetAvgMpg={Math.round(fleetAvgMpg * 100) / 100}
      totalFuelCosts={costResult.data?.totalFuelCosts ?? 0}
    />
  )
}
