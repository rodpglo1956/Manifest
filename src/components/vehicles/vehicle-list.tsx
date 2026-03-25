'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Vehicle, VehicleStatus } from '@/types/database'
import { VEHICLE_CLASS_LABELS } from '@/lib/fleet/fleet-helpers'
import { StatusBadge } from '@/components/ui/status-badge'

const typeLabels: Record<string, string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  sprinter: 'Sprinter',
  box_truck: 'Box Truck',
  medical_van: 'Medical Van',
  hotshot: 'Hotshot',
  straight_truck: 'Straight Truck',
  day_cab: 'Day Cab',
  sleeper: 'Sleeper',
  tanker: 'Tanker',
  dry_van_trailer: 'Dry Van Trailer',
  flatbed_trailer: 'Flatbed Trailer',
  reefer_trailer: 'Reefer Trailer',
  step_deck_trailer: 'Step Deck Trailer',
  other: 'Other',
}

const STATUS_FILTERS: { value: VehicleStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'in_shop', label: 'In Shop' },
  { value: 'out_of_service', label: 'Out of Service' },
  { value: 'parked', label: 'Parked' },
  { value: 'sold', label: 'Sold' },
  { value: 'totaled', label: 'Totaled' },
]

interface VehicleWithDriver extends Vehicle {
  driver_name?: string | null
}

interface VehicleListProps {
  vehicles: VehicleWithDriver[]
}

export function VehicleList({ vehicles }: VehicleListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status') ?? 'all'

  const filtered = statusFilter === 'all'
    ? vehicles
    : vehicles.filter((v) => v.status === statusFilter)

  function handleFilter(status: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (status === 'all') {
      params.delete('status')
    } else {
      params.set('status', status)
    }
    router.push(`/fleet?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      {/* Status filter buttons */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((sf) => (
          <button
            key={sf.value}
            onClick={() => handleFilter(sf.value)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              statusFilter === sf.value
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {sf.label}
            {sf.value !== 'all' && (
              <span className="ml-1 text-xs">
                ({vehicles.filter((v) => v.status === sf.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-8 text-center">
          <p className="text-gray-500">
            {statusFilter === 'all'
              ? 'No vehicles yet. Add your first vehicle to get started.'
              : `No vehicles with status "${statusFilter.replace(/_/g, ' ')}".`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Unit #</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Year / Make / Model</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 hidden md:table-cell">Class</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 hidden lg:table-cell">Driver</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/fleet/${vehicle.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {vehicle.unit_number}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') || '--'}
                    </td>
                    <td className="py-3 px-4 text-gray-700 hidden md:table-cell">
                      {VEHICLE_CLASS_LABELS[vehicle.vehicle_class] ?? '--'}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {typeLabels[vehicle.vehicle_type] ?? vehicle.vehicle_type}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={vehicle.status} variant="vehicle" />
                    </td>
                    <td className="py-3 px-4 text-gray-700 hidden lg:table-cell">
                      {vehicle.driver_name ?? '--'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/fleet/${vehicle.id}/edit`}
                        className="text-sm text-primary hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
