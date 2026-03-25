import Link from 'next/link'
import type { Vehicle } from '@/types/database'

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
}

const typeLabels: Record<string, string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  sprinter: 'Sprinter',
  box_truck: 'Box Truck',
  other: 'Other',
}

interface VehicleListProps {
  vehicles: Vehicle[]
}

export function VehicleList({ vehicles }: VehicleListProps) {
  if (vehicles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-8 text-center">
        <p className="text-gray-500">No vehicles yet. Add your first vehicle to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 font-medium text-gray-600">Unit #</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">VIN</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Year</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Make / Model</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr
                key={vehicle.id}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 px-4">
                  <Link
                    href={`/fleet/${vehicle.id}/edit`}
                    className="text-primary hover:underline font-medium"
                  >
                    {vehicle.unit_number}
                  </Link>
                </td>
                <td className="py-3 px-4 font-mono text-gray-600 text-xs">
                  {vehicle.vin || '--'}
                </td>
                <td className="py-3 px-4 text-gray-700">
                  {vehicle.year ?? '--'}
                </td>
                <td className="py-3 px-4 text-gray-700">
                  {[vehicle.make, vehicle.model].filter(Boolean).join(' ') || '--'}
                </td>
                <td className="py-3 px-4 text-gray-700">
                  {typeLabels[vehicle.vehicle_type] ?? vehicle.vehicle_type}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      statusColors[vehicle.status] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {vehicle.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
