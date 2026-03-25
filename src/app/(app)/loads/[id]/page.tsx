import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoadDetail } from '@/components/loads/load-detail'
import type { Load, LoadStatusHistory, Driver, Vehicle } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LoadDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Get user org_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    notFound()
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  const orgId = profile?.org_id ?? ''

  // Fetch load
  const { data: load, error } = await supabase
    .from('loads')
    .select('id, org_id, load_number, status, pickup_address, pickup_city, pickup_state, pickup_zip, pickup_date, pickup_time, pickup_contact_name, pickup_contact_phone, pickup_notes, delivery_address, delivery_city, delivery_state, delivery_zip, delivery_date, delivery_time, delivery_contact_name, delivery_contact_phone, delivery_notes, commodity, weight, weight_unit, pieces, equipment_type, temperature_min, temperature_max, hazmat, rate_amount, rate_type, miles, fuel_surcharge, accessorial_charges, total_charges, driver_id, vehicle_id, broker_name, broker_contact, broker_phone, broker_email, broker_mc_number, broker_reference, bol_url, rate_confirmation_url, pod_url, notes, created_by, created_at, updated_at')
    .eq('id', id)
    .single() as { data: Load | null; error: unknown }

  if (error || !load) {
    notFound()
  }

  // Fetch driver if assigned
  let driver: Pick<Driver, 'id' | 'first_name' | 'last_name'> | null = null
  if (load.driver_id) {
    const { data } = await supabase
      .from('drivers')
      .select('id, first_name, last_name')
      .eq('id', load.driver_id)
      .single() as { data: Pick<Driver, 'id' | 'first_name' | 'last_name'> | null }
    driver = data
  }

  // Fetch vehicle if assigned
  let vehicle: Pick<Vehicle, 'id' | 'unit_number' | 'make' | 'model'> | null = null
  if (load.vehicle_id) {
    const { data } = await supabase
      .from('vehicles')
      .select('id, unit_number, make, model')
      .eq('id', load.vehicle_id)
      .single() as { data: Pick<Vehicle, 'id' | 'unit_number' | 'make' | 'model'> | null }
    vehicle = data
  }

  // Fetch status history
  const { data: statusHistory } = await supabase
    .from('load_status_history')
    .select('id, load_id, old_status, new_status, changed_by, location_lat, location_lng, notes, created_at')
    .eq('load_id', id)
    .order('created_at', { ascending: false }) as { data: LoadStatusHistory[] | null }

  // Enrich status history with user names
  const changedByIds = [...new Set((statusHistory ?? []).filter((h) => h.changed_by).map((h) => h.changed_by!))]
  let userNameMap: Record<string, string> = {}
  if (changedByIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', changedByIds) as { data: { id: string; full_name: string | null }[] | null }
    if (profiles) {
      userNameMap = Object.fromEntries(
        profiles.map((p) => [p.id, p.full_name ?? 'Unknown'])
      )
    }
  }

  const enrichedHistory = (statusHistory ?? []).map((h) => ({
    ...h,
    changed_by_name: h.changed_by ? userNameMap[h.changed_by] ?? null : null,
  }))

  const loadWithRelations = {
    ...load,
    driver,
    vehicle,
  }

  return (
    <div className="max-w-5xl">
      <LoadDetail
        load={loadWithRelations}
        statusHistory={enrichedHistory}
        orgId={orgId}
      />
    </div>
  )
}
