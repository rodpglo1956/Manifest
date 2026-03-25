import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VehicleList } from '@/components/vehicles/vehicle-list'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Vehicle, VehicleStatus } from '@/types/database'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Fleet | Manifest',
}

export default async function FleetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  // Fetch all expanded vehicle fields plus current driver name
  const { data: vehiclesRaw } = await supabase
    .from('vehicles')
    .select('*, current_driver:drivers!vehicles_current_driver_id_fkey(first_name, last_name)')
    .eq('org_id', profile.org_id)
    .order('unit_number', { ascending: true })

  type VehicleWithJoin = Vehicle & {
    current_driver: { first_name: string; last_name: string } | null
  }

  const vehicles = (vehiclesRaw as VehicleWithJoin[] | null) ?? []

  // Enrich with driver_name for the list component
  const vehiclesWithDriver = vehicles.map((v) => ({
    ...v,
    driver_name: v.current_driver
      ? `${v.current_driver.first_name} ${v.current_driver.last_name}`
      : null,
  }))

  // Status counts for subtitle
  const statusCounts = vehiclesWithDriver.reduce(
    (acc, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const activeCount = statusCounts['active'] ?? 0
  const inShopCount = statusCounts['in_shop'] ?? 0
  const oosCount = statusCounts['out_of_service'] ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Fleet</h1>
          <p className="text-gray-500 mt-1">
            {vehiclesWithDriver.length} vehicle{vehiclesWithDriver.length !== 1 ? 's' : ''}
            {vehiclesWithDriver.length > 0 && (
              <span className="ml-2 text-xs">
                ({activeCount} active
                {inShopCount > 0 && `, ${inShopCount} in shop`}
                {oosCount > 0 && `, ${oosCount} OOS`})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/fleet/new"
            className="py-2 px-4 bg-primary text-white font-medium rounded-md hover:bg-primary-hover transition-colors"
          >
            Add Vehicle
          </Link>
        </div>
      </div>

      <Suspense fallback={<div className="text-gray-400">Loading vehicles...</div>}>
        <VehicleList vehicles={vehiclesWithDriver} />
      </Suspense>
    </div>
  )
}
