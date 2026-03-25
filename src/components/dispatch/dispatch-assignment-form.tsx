'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, MapPin, Sparkles } from 'lucide-react'
import { createDispatchSchema, type CreateDispatchInput } from '@/schemas/dispatch'
import { createDispatch } from '@/app/(app)/dispatch/actions'
import { DriverSuggestions } from '@/components/dispatch/driver-suggestions'
import type { Load, Driver, Vehicle } from '@/types/database'

type AssignTab = 'suggested' | 'manual'

interface DispatchAssignmentFormProps {
  load: Load
  drivers: Driver[]
  vehicles: Pick<Vehicle, 'id' | 'unit_number' | 'make' | 'model'>[]
  onClose: () => void
}

export function DispatchAssignmentForm({ load, drivers, vehicles, onClose }: DispatchAssignmentFormProps) {
  const [activeTab, setActiveTab] = useState<AssignTab>('suggested')
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CreateDispatchInput>({
    resolver: zodResolver(createDispatchSchema),
    defaultValues: {
      load_id: load.id,
      driver_id: '',
      vehicle_id: '',
      dispatcher_notes: '',
    },
  })

  // When driver changes, pre-select their current vehicle
  const selectedDriverId = watch('driver_id')
  useEffect(() => {
    if (selectedDriverId) {
      const driver = drivers.find((d) => d.id === selectedDriverId)
      if (driver?.current_vehicle_id) {
        setValue('vehicle_id', driver.current_vehicle_id)
      }
    }
  }, [selectedDriverId, drivers, setValue])

  const onSubmit = (data: CreateDispatchInput) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('load_id', data.load_id)
      formData.set('driver_id', data.driver_id)
      if (data.vehicle_id) {
        formData.set('vehicle_id', data.vehicle_id)
      }
      if (data.dispatcher_notes) {
        formData.set('dispatcher_notes', data.dispatcher_notes)
      }

      const result = await createDispatch(formData)
      if (result.error) {
        setError('root', { message: result.error })
      } else {
        onClose()
      }
    })
  }

  return (
    <div className="bg-white rounded-lg border border-primary shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-primary-light rounded-t-lg">
        <h3 className="text-sm font-semibold text-primary">Assign Dispatch</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4">
        {/* Load summary */}
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm font-medium text-gray-900">
            {load.load_number || 'No Number'}
          </p>
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
            <MapPin className="w-3 h-3" />
            <span>{load.pickup_city}, {load.pickup_state}</span>
            <span className="text-gray-400 mx-0.5">&rarr;</span>
            <span>{load.delivery_city}, {load.delivery_state}</span>
          </div>
        </div>

        {/* Suggested / Manual tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('suggested')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'suggested'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Suggested
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'manual'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Manual
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'suggested' ? (
          <DriverSuggestions loadId={load.id} vehicles={vehicles} onClose={onClose} />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <input type="hidden" {...register('load_id')} />

            {/* Driver dropdown */}
            <div>
              <label htmlFor="driver_id" className="block text-sm font-medium text-gray-700 mb-1">
                Driver <span className="text-red-500">*</span>
              </label>
              <select
                id="driver_id"
                {...register('driver_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              >
                <option value="">Select a driver...</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.first_name} {driver.last_name}
                    {driver.current_vehicle_id ? ' (has vehicle)' : ''}
                  </option>
                ))}
              </select>
              {errors.driver_id && (
                <p className="mt-1 text-xs text-red-600">{errors.driver_id.message}</p>
              )}
            </div>

            {/* Vehicle dropdown */}
            <div>
              <label htmlFor="vehicle_id" className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle
              </label>
              <select
                id="vehicle_id"
                {...register('vehicle_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              >
                <option value="">No vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.unit_number} - {vehicle.make} {vehicle.model}
                  </option>
                ))}
              </select>
            </div>

            {/* Dispatcher notes */}
            <div>
              <label htmlFor="dispatcher_notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="dispatcher_notes"
                rows={2}
                {...register('dispatcher_notes')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Instructions for the driver..."
              />
            </div>

            {/* Error message */}
            {errors.root && (
              <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-xs text-red-700">{errors.root.message}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {isPending ? 'Assigning...' : 'Assign Driver'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-sm text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
