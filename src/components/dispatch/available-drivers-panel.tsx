import { Phone, Truck } from 'lucide-react'
import type { Driver, Vehicle } from '@/types/database'

type DriverWithVehicle = Driver & {
  vehicle_unit_number?: string | null
}

interface AvailableDriversPanelProps {
  drivers: Driver[]
  busyDriverIds: string[]
  vehicles: Pick<Vehicle, 'id' | 'unit_number'>[]
}

export function AvailableDriversPanel({ drivers, busyDriverIds, vehicles }: AvailableDriversPanelProps) {
  const busySet = new Set(busyDriverIds)

  // Build vehicle lookup
  const vehicleMap: Record<string, string> = {}
  for (const v of vehicles) {
    vehicleMap[v.id] = v.unit_number
  }

  // Enrich drivers with vehicle info
  const enrichedDrivers: DriverWithVehicle[] = drivers.map((d) => ({
    ...d,
    vehicle_unit_number: d.current_vehicle_id ? vehicleMap[d.current_vehicle_id] ?? null : null,
  }))

  const availableDrivers = enrichedDrivers.filter((d) => !busySet.has(d.id))
  const onLoadDrivers = enrichedDrivers.filter((d) => busySet.has(d.id))

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Drivers</h2>
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
          {availableDrivers.length} available
        </span>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {/* Available section */}
        {availableDrivers.length > 0 && (
          <div>
            <div className="px-4 py-2 bg-green-50 border-b border-green-100">
              <span className="text-xs font-medium text-green-700">Available</span>
            </div>
            <div className="divide-y divide-gray-100">
              {availableDrivers.map((driver) => (
                <DriverCard key={driver.id} driver={driver} availability="available" />
              ))}
            </div>
          </div>
        )}

        {/* On a Load section */}
        {onLoadDrivers.length > 0 && (
          <div>
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
              <span className="text-xs font-medium text-blue-700">On a Load</span>
            </div>
            <div className="divide-y divide-gray-100">
              {onLoadDrivers.map((driver) => (
                <DriverCard key={driver.id} driver={driver} availability="on_load" />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {drivers.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-gray-500">No active drivers</p>
          </div>
        )}
      </div>
    </div>
  )
}

function DriverCard({ driver, availability }: { driver: DriverWithVehicle; availability: 'available' | 'on_load' }) {
  return (
    <div className="px-4 py-2.5 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {driver.first_name} {driver.last_name}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            {driver.phone && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Phone className="w-3 h-3" />
                {driver.phone}
              </span>
            )}
            {driver.vehicle_unit_number && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Truck className="w-3 h-3" />
                {driver.vehicle_unit_number}
              </span>
            )}
          </div>
        </div>
        <span
          className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
            availability === 'available'
              ? 'bg-green-50 text-green-700'
              : 'bg-blue-50 text-blue-700'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              availability === 'available' ? 'bg-green-500' : 'bg-blue-500'
            }`}
          />
          {availability === 'available' ? 'Free' : 'On Load'}
        </span>
      </div>
    </div>
  )
}
