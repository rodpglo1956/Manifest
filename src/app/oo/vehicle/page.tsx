import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OOVehicleDashboard } from '@/components/fleet/oo-vehicle-dashboard'
import { getVehicleCostPerMile } from '@/lib/fleet/actions'
import { Truck } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Vehicle, MaintenanceRecord, FuelTransaction } from '@/types/database'

export const metadata: Metadata = {
  title: 'My Vehicle | Manifest',
}

export default async function OOVehiclePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) {
    redirect('/onboarding')
  }

  // Detect owner-operator via org_members count === 1 (per Phase 4 convention)
  const { count: memberCount } = await supabase
    .from('org_members')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', profile.org_id)

  if ((memberCount ?? 0) !== 1) {
    // Non-OO users should use the fleet management page
    redirect('/fleet')
  }

  // Get driver record linked to this user
  const { data: driver } = await supabase
    .from('drivers')
    .select('id, current_vehicle_id')
    .eq('user_id', user.id)
    .single()

  if (!driver?.current_vehicle_id) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold text-gray-900">My Vehicle</h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-base font-medium text-gray-900 mb-1">No Vehicle Yet</h2>
          <p className="text-sm text-gray-500 mb-4">
            Add your vehicle to start tracking maintenance, fuel, and cost of ownership.
          </p>
          <Link
            href="/fleet/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            <Truck className="w-4 h-4" />
            Add Vehicle
          </Link>
        </div>
      </div>
    )
  }

  // Fetch vehicle data
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', driver.current_vehicle_id)
    .single()

  if (!vehicle) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold text-gray-900">My Vehicle</h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-500">Vehicle data not found.</p>
        </div>
      </div>
    )
  }

  // Fetch maintenance records
  const { data: maintenanceRecords } = await supabase
    .from('maintenance_records')
    .select('*')
    .eq('vehicle_id', driver.current_vehicle_id)
    .order('date_in', { ascending: false })

  // Fetch fuel transactions (last 30)
  const { data: fuelTransactions } = await supabase
    .from('fuel_transactions')
    .select('*')
    .eq('vehicle_id', driver.current_vehicle_id)
    .order('transaction_date', { ascending: false })
    .limit(30)

  // Get cost per mile data
  const costResult = await getVehicleCostPerMile(driver.current_vehicle_id)
  const costData = costResult.data ?? {
    costPerMile: 0,
    breakdown: { maintenance: 0, fuel: 0, depreciation: 0, insurance: 0, total: 0 },
    totalMiles: 0,
  }

  // Calculate previous month MPG for trend comparison
  const now = new Date()
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const typedFuel = (fuelTransactions ?? []) as FuelTransaction[]
  const prevMonthFuel = typedFuel.filter((f) => {
    const d = new Date(f.transaction_date)
    return d >= startOfPrevMonth && d < startOfThisMonth && f.odometer_reading !== null
  })

  let previousMonthMpg: number | null = null
  if (prevMonthFuel.length >= 2) {
    const sorted = [...prevMonthFuel].sort((a, b) => (a.odometer_reading ?? 0) - (b.odometer_reading ?? 0))
    const miles = (sorted[sorted.length - 1].odometer_reading ?? 0) - (sorted[0].odometer_reading ?? 0)
    const gallons = sorted.slice(1).reduce((sum, f) => sum + f.gallons, 0)
    if (gallons > 0 && miles > 0) {
      previousMonthMpg = Math.round((miles / gallons) * 100) / 100
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Truck className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-semibold text-gray-900">My Vehicle</h1>
      </div>

      <OOVehicleDashboard
        vehicle={vehicle as Vehicle}
        driverId={driver.id}
        orgId={profile.org_id}
        maintenanceRecords={(maintenanceRecords ?? []) as MaintenanceRecord[]}
        fuelTransactions={(fuelTransactions ?? []) as FuelTransaction[]}
        costData={costData}
        avgMpg={(vehicle as Vehicle).avg_mpg}
        previousMonthMpg={previousMonthMpg}
      />
    </div>
  )
}
