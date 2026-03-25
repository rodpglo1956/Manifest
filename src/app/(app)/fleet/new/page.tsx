import { VehicleForm } from '@/components/vehicles/vehicle-form'
import { createVehicle } from '@/app/(app)/fleet/actions'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Add Vehicle | Manifest',
}

export default function NewVehiclePage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/fleet"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          &larr; Back to Fleet
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-2">Add Vehicle</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
        <VehicleForm action={createVehicle} />
      </div>
    </div>
  )
}
