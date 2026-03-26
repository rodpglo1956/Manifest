'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { firstVehicleSchema, type FirstVehicleInput } from '@/lib/onboarding/schemas'
import { saveFirstVehicle } from '@/lib/onboarding/actions'

interface FirstVehicleStepProps {
  onNext: () => void
  onBack: () => void
}

export function FirstVehicleStep({ onNext, onBack }: FirstVehicleStepProps) {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FirstVehicleInput>({
    resolver: zodResolver(firstVehicleSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      make: '',
      model: '',
      vin: '',
      unit_number: '',
    },
  })

  const onSubmit = (data: FirstVehicleInput) => {
    startTransition(async () => {
      const result = await saveFirstVehicle(data)
      if (result?.error) {
        setError('root', { message: result.error })
        return
      }
      onNext()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Add Your First Vehicle</h2>
        <p className="text-sm text-gray-500 mt-1">
          You can add more vehicles later from the Fleet page
        </p>
      </div>

      {errors.root && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md">{errors.root.message}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Unit Number <span className="text-red-500">*</span>
        </label>
        <input
          {...register('unit_number')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., TRUCK-001"
        />
        {errors.unit_number && (
          <p className="text-sm text-red-600 mt-1">{errors.unit_number.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            {...register('year')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.year && (
            <p className="text-sm text-red-600 mt-1">{errors.year.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Make <span className="text-red-500">*</span>
          </label>
          <input
            {...register('make')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Freightliner"
          />
          {errors.make && (
            <p className="text-sm text-red-600 mt-1">{errors.make.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model <span className="text-red-500">*</span>
          </label>
          <input
            {...register('model')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Cascadia"
          />
          {errors.model && (
            <p className="text-sm text-red-600 mt-1">{errors.model.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">VIN (optional)</label>
        <input
          {...register('vin')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="17-character Vehicle Identification Number"
        />
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {isPending ? 'Saving...' : 'Next'}
        </button>
      </div>
    </form>
  )
}
