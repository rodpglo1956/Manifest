import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Load, Vehicle } from '@/types/database'
import { DriverLoadsClient } from './client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Loads | Manifest',
}

// Active statuses for the driver's current load
const ACTIVE_STATUSES = ['dispatched', 'in_transit', 'at_pickup', 'loaded', 'at_delivery'] as const

export default async function DriverLoadsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get driver record linked to this user
  const { data: driver } = await supabase
    .from('drivers')
    .select('id, org_id')
    .eq('user_id', user.id)
    .single()

  if (!driver) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">No Driver Profile</h1>
        <p className="text-gray-500">Your account is not linked to a driver profile. Contact your admin.</p>
      </div>
    )
  }

  // Query active load
  const { data: activeLoad } = await supabase
    .from('loads')
    .select('*')
    .eq('driver_id', driver.id)
    .in('status', ACTIVE_STATUSES)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single() as { data: Load | null }

  // If active load exists, fetch assigned vehicle
  let vehicle: Vehicle | null = null
  if (activeLoad?.vehicle_id) {
    const { data } = await supabase
      .from('vehicles')
      .select('id, org_id, unit_number, vin, year, make, model, vehicle_type, status, created_at, updated_at')
      .eq('id', activeLoad.vehicle_id)
      .single() as { data: Vehicle | null }
    vehicle = data
  }

  // Query load history (past 30 days, excluding active load)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  let historyQuery = supabase
    .from('loads')
    .select('*')
    .eq('driver_id', driver.id)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(50)

  if (activeLoad) {
    historyQuery = historyQuery.neq('id', activeLoad.id)
  }

  const { data: historyLoads } = historyQuery as unknown as { data: Load[] | null }

  // Combine active load with vehicle data
  const activeLoadWithVehicle = activeLoad
    ? { ...activeLoad, vehicle: vehicle }
    : null

  return (
    <DriverLoadsClient
      orgId={driver.org_id}
      activeLoad={activeLoadWithVehicle}
      historyLoads={historyLoads ?? []}
    />
  )
}
