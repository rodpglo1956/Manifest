import { createClient } from '@/lib/supabase/server'
import { DispatchBoard } from './dispatch-board'
import type { ActiveDispatch } from '@/components/dispatch/active-dispatches-list'
import type { Load, Driver, Vehicle, Dispatch, DispatchStatus } from '@/types/database'

export default async function DispatchPage() {
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

  // Fetch unassigned loads (status = booked), ordered by pickup_date
  const { data: rawLoads } = await supabase
    .from('loads')
    .select('*')
    .eq('status', 'booked')
    .order('pickup_date', { ascending: true }) as { data: Load[] | null }
  const unassignedLoads = rawLoads ?? []

  // Fetch active drivers, ordered by last_name
  const { data: rawDrivers } = await supabase
    .from('drivers')
    .select('*')
    .eq('status', 'active')
    .order('last_name') as { data: Driver[] | null }
  const drivers = rawDrivers ?? []

  // Fetch active dispatches (non-terminal) with load and driver info
  const { data: rawDispatches } = await supabase
    .from('dispatches')
    .select('id, status, estimated_pickup_arrival, estimated_delivery_arrival, load_id, driver_id')
    .not('status', 'in', '("completed","rejected")')
    .order('created_at', { ascending: false }) as { data: Pick<Dispatch, 'id' | 'status' | 'estimated_pickup_arrival' | 'estimated_delivery_arrival' | 'load_id' | 'driver_id'>[] | null }
  const dispatches = rawDispatches ?? []

  // Build busy driver IDs from active dispatches
  const busyDriverIds = dispatches.map((d) => d.driver_id)

  // Fetch load details for active dispatches
  const dispatchLoadIds = [...new Set(dispatches.map((d) => d.load_id))]
  let loadMap: Record<string, Pick<Load, 'load_number' | 'pickup_city' | 'pickup_state' | 'delivery_city' | 'delivery_state' | 'pickup_date' | 'delivery_date' | 'equipment_type'>> = {}
  if (dispatchLoadIds.length > 0) {
    const { data: loadData } = await supabase
      .from('loads')
      .select('id, load_number, pickup_city, pickup_state, delivery_city, delivery_state, pickup_date, delivery_date, equipment_type')
      .in('id', dispatchLoadIds) as { data: (Pick<Load, 'load_number' | 'pickup_city' | 'pickup_state' | 'delivery_city' | 'delivery_state' | 'pickup_date' | 'delivery_date' | 'equipment_type'> & { id: string })[] | null }
    if (loadData) {
      loadMap = Object.fromEntries(loadData.map((l) => [l.id, l]))
    }
  }

  // Fetch driver details for active dispatches
  const dispatchDriverIds = [...new Set(dispatches.map((d) => d.driver_id))]
  let driverMap: Record<string, Pick<Driver, 'first_name' | 'last_name'>> = {}
  if (dispatchDriverIds.length > 0) {
    const { data: driverData } = await supabase
      .from('drivers')
      .select('id, first_name, last_name')
      .in('id', dispatchDriverIds) as { data: (Pick<Driver, 'first_name' | 'last_name'> & { id: string })[] | null }
    if (driverData) {
      driverMap = Object.fromEntries(driverData.map((d) => [d.id, d]))
    }
  }

  // Build enriched active dispatches
  const activeDispatches: ActiveDispatch[] = dispatches.map((d) => {
    const load = loadMap[d.load_id]
    const driver = driverMap[d.driver_id]
    return {
      id: d.id,
      status: d.status as DispatchStatus,
      estimated_pickup_arrival: d.estimated_pickup_arrival,
      estimated_delivery_arrival: d.estimated_delivery_arrival,
      load_number: load?.load_number ?? null,
      pickup_city: load?.pickup_city ?? null,
      pickup_state: load?.pickup_state ?? null,
      delivery_city: load?.delivery_city ?? null,
      delivery_state: load?.delivery_state ?? null,
      pickup_date: load?.pickup_date ?? null,
      delivery_date: load?.delivery_date ?? null,
      equipment_type: load?.equipment_type ?? null,
      driver_first_name: driver?.first_name ?? 'Unknown',
      driver_last_name: driver?.last_name ?? '',
    }
  })

  // Fetch active vehicles for assignment form
  const { data: rawVehicles } = await supabase
    .from('vehicles')
    .select('id, unit_number, make, model')
    .eq('status', 'active')
    .order('unit_number') as { data: Pick<Vehicle, 'id' | 'unit_number' | 'make' | 'model'>[] | null }
  const vehicles = rawVehicles ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dispatch Board</h1>
      </div>

      <DispatchBoard
        unassignedLoads={unassignedLoads}
        drivers={drivers}
        activeDispatches={activeDispatches}
        busyDriverIds={busyDriverIds}
        vehicles={vehicles}
        orgId={orgId}
      />
    </div>
  )
}
