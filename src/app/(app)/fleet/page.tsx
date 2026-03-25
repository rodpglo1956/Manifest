import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VehicleList } from '@/components/vehicles/vehicle-list'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Vehicle } from '@/types/database'

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

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, org_id, unit_number, vin, year, make, model, vehicle_type, status, created_at, updated_at')
    .eq('org_id', profile.org_id)
    .order('unit_number', { ascending: true }) as { data: Vehicle[] | null }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Fleet</h1>
          <p className="text-gray-500 mt-1">
            {vehicles?.length ?? 0} vehicle{(vehicles?.length ?? 0) !== 1 ? 's' : ''} in your fleet
          </p>
        </div>
        <Link
          href="/fleet/new"
          className="py-2 px-4 bg-primary text-white font-medium rounded-md hover:bg-primary-hover transition-colors"
        >
          Add Vehicle
        </Link>
      </div>

      <VehicleList vehicles={vehicles ?? []} />
    </div>
  )
}
