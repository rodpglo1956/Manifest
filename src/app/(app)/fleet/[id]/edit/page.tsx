import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { VehicleForm } from '@/components/vehicles/vehicle-form'
import { updateVehicle } from '@/app/(app)/fleet/actions'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Vehicle } from '@/types/database'

export const metadata: Metadata = {
  title: 'Edit Vehicle | Manifest',
}

interface EditVehiclePageProps {
  params: Promise<{ id: string }>
}

export default async function EditVehiclePage({ params }: EditVehiclePageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single() as { data: Vehicle | null }

  if (!vehicle) {
    notFound()
  }

  const boundAction = updateVehicle.bind(null, id)

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/fleet/${id}`}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          &larr; Back to Vehicle
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-2">
          Edit Vehicle: {vehicle.unit_number}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
        <VehicleForm
          defaultValues={{
            unit_number: vehicle.unit_number,
            vin: vehicle.vin ?? '',
            year: vehicle.year ?? new Date().getFullYear(),
            make: vehicle.make ?? '',
            model: vehicle.model ?? '',
            vehicle_type: vehicle.vehicle_type,
            vehicle_class: vehicle.vehicle_class ?? 'other',
            fuel_type: vehicle.fuel_type ?? 'diesel',
            status: vehicle.status,
            license_plate: vehicle.license_plate ?? '',
            license_state: vehicle.license_state ?? '',
            registration_expiry: vehicle.registration_expiry ?? '',
            current_odometer: vehicle.current_odometer ?? undefined,
            avg_mpg: vehicle.avg_mpg ?? undefined,
            purchase_date: vehicle.purchase_date ?? '',
            purchase_price: vehicle.purchase_price ?? undefined,
            current_value: vehicle.current_value ?? undefined,
            insurance_policy: vehicle.insurance_policy ?? '',
            notes: vehicle.notes ?? '',
          }}
          action={boundAction}
          isEdit
        />
      </div>
    </div>
  )
}
