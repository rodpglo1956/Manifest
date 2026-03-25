'use client'

import { useFormContext } from 'react-hook-form'
import type { LoadInput } from '@/schemas/load'

const EQUIPMENT_TYPES = [
  { value: 'dry_van', label: 'Dry Van' },
  { value: 'reefer', label: 'Reefer' },
  { value: 'flatbed', label: 'Flatbed' },
  { value: 'sprinter', label: 'Sprinter' },
  { value: 'box_truck', label: 'Box Truck' },
  { value: 'other', label: 'Other' },
] as const

export function StepFreight() {
  const { register, watch, formState: { errors } } = useFormContext<LoadInput>()

  const equipmentType = watch('equipment_type')

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Freight Details</h2>

      <div>
        <label htmlFor="commodity" className="block text-sm font-medium mb-1">
          Commodity *
        </label>
        <input
          id="commodity"
          type="text"
          {...register('commodity')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="e.g. Electronics, Produce, Steel"
        />
        {errors.commodity && (
          <p className="mt-1 text-sm text-red-600">{errors.commodity.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="weight" className="block text-sm font-medium mb-1">
            Weight
          </label>
          <input
            id="weight"
            type="number"
            step="0.01"
            {...register('weight')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="40000"
          />
          {errors.weight && (
            <p className="mt-1 text-sm text-red-600">{errors.weight.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="weight_unit" className="block text-sm font-medium mb-1">
            Unit
          </label>
          <select
            id="weight_unit"
            {...register('weight_unit')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
          >
            <option value="lbs">lbs</option>
            <option value="kg">kg</option>
          </select>
        </div>

        <div>
          <label htmlFor="pieces" className="block text-sm font-medium mb-1">
            Pieces
          </label>
          <input
            id="pieces"
            type="number"
            {...register('pieces')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="1"
          />
          {errors.pieces && (
            <p className="mt-1 text-sm text-red-600">{errors.pieces.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="equipment_type" className="block text-sm font-medium mb-1">
          Equipment Type *
        </label>
        <select
          id="equipment_type"
          {...register('equipment_type')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
        >
          {EQUIPMENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors.equipment_type && (
          <p className="mt-1 text-sm text-red-600">{errors.equipment_type.message}</p>
        )}
      </div>

      {equipmentType === 'reefer' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="temperature_min" className="block text-sm font-medium mb-1">
              Min Temp (F)
            </label>
            <input
              id="temperature_min"
              type="number"
              {...register('temperature_min')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="34"
            />
          </div>

          <div>
            <label htmlFor="temperature_max" className="block text-sm font-medium mb-1">
              Max Temp (F)
            </label>
            <input
              id="temperature_max"
              type="number"
              {...register('temperature_max')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="38"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          id="hazmat"
          type="checkbox"
          {...register('hazmat')}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="hazmat" className="text-sm font-medium">
          Hazmat Load
        </label>
      </div>
    </div>
  )
}
