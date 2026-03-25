'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { vehicleSchema, type VehicleInput } from '@/schemas/vehicle'
import { useState } from 'react'
import Link from 'next/link'

const VEHICLE_TYPES = [
  { value: 'dry_van', label: 'Dry Van' },
  { value: 'reefer', label: 'Reefer' },
  { value: 'flatbed', label: 'Flatbed' },
  { value: 'sprinter', label: 'Sprinter' },
  { value: 'box_truck', label: 'Box Truck' },
  { value: 'other', label: 'Other' },
] as const

interface VehicleFormProps {
  defaultValues?: Partial<VehicleInput>
  action: (formData: FormData) => Promise<{ error?: { form: string[] } } | void>
  isEdit?: boolean
}

export function VehicleForm({ defaultValues, action, isEdit = false }: VehicleFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VehicleInput>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      unit_number: '',
      vin: '',
      year: new Date().getFullYear(),
      make: '',
      model: '',
      vehicle_type: 'dry_van',
      status: 'active',
      ...defaultValues,
    },
  })

  async function onSubmit(data: VehicleInput) {
    setServerError(null)
    const formData = new FormData()
    formData.append('unit_number', data.unit_number)
    formData.append('vin', data.vin ?? '')
    formData.append('year', String(data.year))
    formData.append('make', data.make)
    formData.append('model', data.model)
    formData.append('vehicle_type', data.vehicle_type)
    formData.append('status', data.status ?? 'active')

    const result = await action(formData)
    if (result?.error?.form) {
      setServerError(result.error.form[0])
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <div>
        <label htmlFor="unit_number" className="block text-sm font-medium mb-1">
          Unit Number *
        </label>
        <input
          id="unit_number"
          type="text"
          {...register('unit_number')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="e.g. T-101"
        />
        {errors.unit_number && (
          <p className="mt-1 text-sm text-red-600">{errors.unit_number.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="vin" className="block text-sm font-medium mb-1">
          VIN
        </label>
        <input
          id="vin"
          type="text"
          maxLength={17}
          {...register('vin')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
          placeholder="17-character VIN"
        />
        {errors.vin && (
          <p className="mt-1 text-sm text-red-600">{errors.vin.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="year" className="block text-sm font-medium mb-1">
            Year *
          </label>
          <input
            id="year"
            type="number"
            {...register('year')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="2024"
          />
          {errors.year && (
            <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="make" className="block text-sm font-medium mb-1">
            Make *
          </label>
          <input
            id="make"
            type="text"
            {...register('make')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Freightliner"
          />
          {errors.make && (
            <p className="mt-1 text-sm text-red-600">{errors.make.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="model" className="block text-sm font-medium mb-1">
            Model *
          </label>
          <input
            id="model"
            type="text"
            {...register('model')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Cascadia"
          />
          {errors.model && (
            <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="vehicle_type" className="block text-sm font-medium mb-1">
          Type *
        </label>
        <select
          id="vehicle_type"
          {...register('vehicle_type')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
        >
          {VEHICLE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors.vehicle_type && (
          <p className="mt-1 text-sm text-red-600">{errors.vehicle_type.message}</p>
        )}
      </div>

      {isEdit && (
        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1">
            Status
          </label>
          <select
            id="status"
            {...register('status')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
          )}
        </div>
      )}

      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{serverError}</p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="py-2 px-4 bg-primary text-white font-medium rounded-md hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting
            ? isEdit ? 'Saving...' : 'Adding...'
            : isEdit ? 'Save Changes' : 'Add Vehicle'}
        </button>
        <Link
          href="/fleet"
          className="py-2 px-4 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
