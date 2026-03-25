'use client'

import { useState } from 'react'
import { StatusBadge } from '@/components/ui/status-badge'
import { DriverFuelForm } from '@/components/fleet/driver-fuel-form'
import { DriverIssueReport } from '@/components/fleet/driver-issue-report'
import { VEHICLE_CLASS_LABELS } from '@/lib/fleet/fleet-helpers'
import { formatCurrency } from '@/lib/fleet/fleet-helpers'
import { AlertTriangle, Fuel } from 'lucide-react'
import type { Vehicle, FuelTransaction, VehicleClass } from '@/types/database'

interface DriverVehiclePanelProps {
  vehicle: Vehicle
  driverId: string
  orgId: string
  recentFuel: FuelTransaction[]
}

export function DriverVehiclePanel({ vehicle, driverId, orgId, recentFuel }: DriverVehiclePanelProps) {
  const [showFuelForm, setShowFuelForm] = useState(false)
  const [showIssueForm, setShowIssueForm] = useState(false)

  // Registration expiry warning
  const registrationWarning = vehicle.registration_expiry
    ? (() => {
        const expiry = new Date(vehicle.registration_expiry)
        const now = new Date()
        const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (daysUntil < 0) return { text: 'Expired', warn: true }
        if (daysUntil <= 30) return { text: `Expires in ${daysUntil} days`, warn: true }
        return null
      })()
    : null

  return (
    <div className="space-y-4">
      {/* Vehicle Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{vehicle.unit_number}</h2>
            <p className="text-base text-gray-600">
              {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}
            </p>
          </div>
          <StatusBadge status={vehicle.status} variant="vehicle" />
        </div>

        <div className="text-sm text-gray-500 mb-3">
          {VEHICLE_CLASS_LABELS[vehicle.vehicle_class as VehicleClass] ?? vehicle.vehicle_class}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {vehicle.vin && (
            <div>
              <span className="text-gray-500">VIN:</span>{' '}
              <span className="font-mono text-gray-900">...{vehicle.vin.slice(-6)}</span>
            </div>
          )}
          {vehicle.license_plate && (
            <div>
              <span className="text-gray-500">Plate:</span>{' '}
              <span className="font-medium text-gray-900">{vehicle.license_plate}</span>
            </div>
          )}
          {vehicle.fuel_type && (
            <div>
              <span className="text-gray-500">Fuel:</span>{' '}
              <span className="font-medium text-gray-900 capitalize">{vehicle.fuel_type}</span>
            </div>
          )}
          {vehicle.current_odometer !== null && (
            <div>
              <span className="text-gray-500">Odometer:</span>{' '}
              <span className="font-medium text-gray-900">{vehicle.current_odometer.toLocaleString()} mi</span>
            </div>
          )}
        </div>

        {registrationWarning && (
          <div className="mt-3 flex items-center gap-1.5 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Registration: {registrationWarning.text}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!showIssueForm && !showFuelForm && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowIssueForm(true)}
            className="flex items-center justify-center gap-2 py-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium text-base hover:bg-red-100 min-h-[44px]"
          >
            <AlertTriangle className="w-5 h-5" />
            Report Issue
          </button>
          <button
            onClick={() => setShowFuelForm(true)}
            className="flex items-center justify-center gap-2 py-3.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl font-medium text-base hover:bg-blue-100 min-h-[44px]"
          >
            <Fuel className="w-5 h-5" />
            Log Fuel
          </button>
        </div>
      )}

      {/* Issue Report Form */}
      {showIssueForm && (
        <DriverIssueReport
          vehicleId={vehicle.id}
          unitNumber={vehicle.unit_number}
          currentOdometer={vehicle.current_odometer}
          orgId={orgId}
          onClose={() => setShowIssueForm(false)}
        />
      )}

      {/* Fuel Form */}
      {showFuelForm && (
        <DriverFuelForm
          vehicleId={vehicle.id}
          driverId={driverId}
          onClose={() => setShowFuelForm(false)}
        />
      )}

      {/* Recent Fuel Logs */}
      {recentFuel.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Fuel Logs</h3>
          <div className="space-y-2">
            {recentFuel.slice(0, 5).map((fuel) => (
              <div
                key={fuel.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {fuel.gallons.toFixed(1)} gal @ {formatCurrency(fuel.total_cost)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(fuel.transaction_date).toLocaleDateString()}
                    {fuel.odometer_reading ? ` | ${fuel.odometer_reading.toLocaleString()} mi` : ''}
                  </p>
                </div>
                {fuel.price_per_gallon && (
                  <span className="text-xs text-gray-500">{formatCurrency(fuel.price_per_gallon)}/gal</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
