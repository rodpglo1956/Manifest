import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DriverVehiclePanel } from '@/components/fleet/driver-vehicle-panel'
import { Truck } from 'lucide-react'
import type { Metadata } from 'next'
import type { Vehicle, FuelTransaction } from '@/types/database'

export const metadata: Metadata = {
  title: 'My Vehicle | Manifest',
}

export default async function DriverVehiclePage() {
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
          <h2 className="text-base font-medium text-gray-900 mb-1">No Vehicle Assigned</h2>
          <p className="text-sm text-gray-500">
            You do not currently have a vehicle assigned. Contact your dispatcher to get assigned to a vehicle.
          </p>
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

  // Fetch recent fuel transactions for this vehicle by this driver
  const { data: recentFuel } = await supabase
    .from('fuel_transactions')
    .select('*')
    .eq('vehicle_id', driver.current_vehicle_id)
    .eq('driver_id', driver.id)
    .order('transaction_date', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Truck className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-semibold text-gray-900">My Vehicle</h1>
      </div>

      <DriverVehiclePanel
        vehicle={vehicle as Vehicle}
        driverId={driver.id}
        orgId={profile.org_id}
        recentFuel={(recentFuel ?? []) as FuelTransaction[]}
      />
    </div>
  )
}
