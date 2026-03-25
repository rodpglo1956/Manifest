import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoadWizard } from '@/components/loads/load-form/load-wizard'
import type { Load, Driver, Vehicle } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LoadEditPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch load
  const { data: load } = await supabase
    .from('loads')
    .select('id, org_id, load_number, status, pickup_address, pickup_city, pickup_state, pickup_zip, pickup_date, pickup_time, pickup_contact_name, pickup_contact_phone, pickup_notes, delivery_address, delivery_city, delivery_state, delivery_zip, delivery_date, delivery_time, delivery_contact_name, delivery_contact_phone, delivery_notes, commodity, weight, weight_unit, pieces, equipment_type, temperature_min, temperature_max, hazmat, rate_amount, rate_type, miles, fuel_surcharge, accessorial_charges, total_charges, driver_id, vehicle_id, broker_name, broker_contact, broker_phone, broker_email, broker_mc_number, broker_reference, bol_url, rate_confirmation_url, pod_url, notes, created_by, created_at, updated_at')
    .eq('id', id)
    .single() as { data: Load | null }

  if (!load) {
    notFound()
  }

  // Fetch drivers and vehicles for assignment dropdowns
  const { data: drivers } = await supabase
    .from('drivers')
    .select('id, first_name, last_name, status')
    .order('last_name') as { data: Pick<Driver, 'id' | 'first_name' | 'last_name' | 'status'>[] | null }

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, unit_number, make, model, status')
    .order('unit_number') as { data: Pick<Vehicle, 'id' | 'unit_number' | 'make' | 'model' | 'status'>[] | null }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Edit Load{' '}
          <span className="font-mono text-gray-500">{load.load_number}</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Update load details. Status changes are made from the detail page.
        </p>
      </div>

      <LoadWizard
        drivers={drivers ?? []}
        vehicles={vehicles ?? []}
        editMode
        loadId={id}
        defaultValues={{
          pickup_address: load.pickup_address ?? '',
          pickup_city: load.pickup_city ?? '',
          pickup_state: load.pickup_state ?? '',
          pickup_zip: load.pickup_zip ?? '',
          pickup_date: load.pickup_date ?? '',
          pickup_time: load.pickup_time ?? '',
          pickup_contact_name: load.pickup_contact_name ?? '',
          pickup_contact_phone: load.pickup_contact_phone ?? '',
          pickup_notes: load.pickup_notes ?? '',
          delivery_address: load.delivery_address ?? '',
          delivery_city: load.delivery_city ?? '',
          delivery_state: load.delivery_state ?? '',
          delivery_zip: load.delivery_zip ?? '',
          delivery_date: load.delivery_date ?? '',
          delivery_time: load.delivery_time ?? '',
          delivery_contact_name: load.delivery_contact_name ?? '',
          delivery_contact_phone: load.delivery_contact_phone ?? '',
          delivery_notes: load.delivery_notes ?? '',
          commodity: load.commodity ?? '',
          weight: load.weight ?? undefined,
          weight_unit: load.weight_unit ?? 'lbs',
          pieces: load.pieces ?? undefined,
          equipment_type: load.equipment_type ?? 'dry_van',
          temperature_min: load.temperature_min ?? undefined,
          temperature_max: load.temperature_max ?? undefined,
          hazmat: load.hazmat ?? false,
          rate_amount: load.rate_amount ?? undefined,
          rate_type: load.rate_type ?? 'flat',
          miles: load.miles ?? undefined,
          fuel_surcharge: load.fuel_surcharge ?? undefined,
          accessorial_charges: load.accessorial_charges ?? undefined,
          broker_name: load.broker_name ?? '',
          broker_contact: load.broker_contact ?? '',
          broker_phone: load.broker_phone ?? '',
          broker_email: load.broker_email ?? '',
          broker_mc_number: load.broker_mc_number ?? '',
          broker_reference: load.broker_reference ?? '',
          driver_id: load.driver_id ?? '',
          vehicle_id: load.vehicle_id ?? '',
          notes: load.notes ?? '',
        }}
      />
    </div>
  )
}
