'use client'

import { useFormContext } from 'react-hook-form'
import type { LoadInput } from '@/schemas/load'
import type { Driver, Vehicle } from '@/types/database'

interface StepAssignmentProps {
  drivers: Pick<Driver, 'id' | 'first_name' | 'last_name' | 'status'>[]
  vehicles: Pick<Vehicle, 'id' | 'unit_number' | 'make' | 'model' | 'status'>[]
}

export function StepAssignment({ drivers, vehicles }: StepAssignmentProps) {
  const { register, formState: { errors } } = useFormContext<LoadInput>()

  const activeDrivers = drivers.filter((d) => d.status === 'active')
  const activeVehicles = vehicles.filter((v) => v.status === 'active')

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Assignment</h2>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-sm text-blue-700">
          Assignment is optional. You can assign a driver and vehicle later from Dispatch.
        </p>
      </div>

      <div>
        <label htmlFor="driver_id" className="block text-sm font-medium mb-1">
          Driver
        </label>
        <select
          id="driver_id"
          {...register('driver_id')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
        >
          <option value="">-- No driver assigned --</option>
          {activeDrivers.map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.first_name} {driver.last_name}
            </option>
          ))}
        </select>
        {errors.driver_id && (
          <p className="mt-1 text-sm text-red-600">{errors.driver_id.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="vehicle_id" className="block text-sm font-medium mb-1">
          Vehicle
        </label>
        <select
          id="vehicle_id"
          {...register('vehicle_id')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
        >
          <option value="">-- No vehicle assigned --</option>
          {activeVehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.unit_number} - {vehicle.make} {vehicle.model}
            </option>
          ))}
        </select>
        {errors.vehicle_id && (
          <p className="mt-1 text-sm text-red-600">{errors.vehicle_id.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          {...register('notes')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Additional notes about this load..."
        />
      </div>
    </div>
  )
}
