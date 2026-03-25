import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { LoadFilters } from '@/components/loads/load-filters'
import { LoadsView } from './loads-view'
import type { Load, LoadStatus, Driver } from '@/types/database'

type LoadWithDriver = Load & {
  driver_first_name?: string | null
  driver_last_name?: string | null
}

interface PageProps {
  searchParams: Promise<{
    status?: string
    driver_id?: string
    date_from?: string
    date_to?: string
    broker?: string
  }>
}

export default async function LoadsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Get user org_id
  const { data: { user } } = await supabase.auth.getUser()
  let orgId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()
    orgId = profile?.org_id ?? null
  }

  // Build loads query with filters
  let query = supabase
    .from('loads')
    .select('id, org_id, load_number, status, pickup_address, pickup_city, pickup_state, pickup_zip, pickup_date, pickup_time, pickup_contact_name, pickup_contact_phone, pickup_notes, delivery_address, delivery_city, delivery_state, delivery_zip, delivery_date, delivery_time, delivery_contact_name, delivery_contact_phone, delivery_notes, commodity, weight, weight_unit, pieces, equipment_type, temperature_min, temperature_max, hazmat, rate_amount, rate_type, miles, fuel_surcharge, accessorial_charges, total_charges, driver_id, vehicle_id, broker_name, broker_contact, broker_phone, broker_email, broker_mc_number, broker_reference, bol_url, rate_confirmation_url, pod_url, notes, created_by, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (params.status) {
    query = query.eq('status', params.status as LoadStatus)
  }
  if (params.driver_id) {
    query = query.eq('driver_id', params.driver_id)
  }
  if (params.date_from) {
    query = query.gte('pickup_date', params.date_from)
  }
  if (params.date_to) {
    query = query.lte('pickup_date', params.date_to)
  }
  if (params.broker) {
    query = query.ilike('broker_name', `%${params.broker}%`)
  }

  const { data: rawLoads } = await query as { data: Load[] | null }
  const loads = rawLoads ?? []

  // Get driver names for display
  const driverIds = [...new Set(loads.filter((l) => l.driver_id).map((l) => l.driver_id!))]
  let driverMap: Record<string, { first_name: string; last_name: string }> = {}

  if (driverIds.length > 0) {
    const { data: drivers } = await supabase
      .from('drivers')
      .select('id, first_name, last_name')
      .in('id', driverIds) as { data: Pick<Driver, 'id' | 'first_name' | 'last_name'>[] | null }

    if (drivers) {
      driverMap = Object.fromEntries(drivers.map((d) => [d.id, { first_name: d.first_name, last_name: d.last_name }]))
    }
  }

  // Enrich loads with driver names
  const enrichedLoads: LoadWithDriver[] = loads.map((load) => ({
    ...load,
    driver_first_name: load.driver_id ? driverMap[load.driver_id]?.first_name ?? null : null,
    driver_last_name: load.driver_id ? driverMap[load.driver_id]?.last_name ?? null : null,
  }))

  // Get all drivers for filter dropdown
  const { data: allDrivers } = await supabase
    .from('drivers')
    .select('id, first_name, last_name')
    .eq('status', 'active')
    .order('last_name') as { data: Pick<Driver, 'id' | 'first_name' | 'last_name'>[] | null }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Loads</h1>
        <Link
          href="/loads/new"
          className="px-4 py-2 bg-primary text-white font-medium rounded-md hover:bg-primary-hover transition-colors"
        >
          Create Load
        </Link>
      </div>

      <Suspense fallback={null}>
        <LoadFilters drivers={allDrivers ?? []} />
      </Suspense>

      <LoadsView loads={enrichedLoads} orgId={orgId} />
    </div>
  )
}
