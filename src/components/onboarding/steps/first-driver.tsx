'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { firstDriverSchema, type FirstDriverInput } from '@/lib/onboarding/schemas'
import { saveFirstDriver, skipFirstDriver } from '@/lib/onboarding/actions'

interface FirstDriverStepProps {
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

export function FirstDriverStep({ onNext, onBack, onSkip }: FirstDriverStepProps) {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FirstDriverInput>({
    resolver: zodResolver(firstDriverSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      cdl_number: '',
      phone: '',
      email: '',
    },
  })

  const onSubmit = (data: FirstDriverInput) => {
    startTransition(async () => {
      const result = await saveFirstDriver(data)
      if (result?.error) {
        setError('root', { message: result.error })
        return
      }
      onNext()
    })
  }

  const handleSkip = () => {
    startTransition(async () => {
      const result = await skipFirstDriver()
      if (result?.error) {
        setError('root', { message: result.error })
        return
      }
      onSkip()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Add Your First Driver</h2>
        <p className="text-sm text-gray-500 mt-1">
          Owner-operator? Skip this step if you drive yourself.
        </p>
      </div>

      {errors.root && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md">{errors.root.message}</div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('first_name')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.first_name && (
            <p className="text-sm text-red-600 mt-1">{errors.first_name.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('last_name')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.last_name && (
            <p className="text-sm text-red-600 mt-1">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CDL Number (optional)</label>
        <input
          {...register('cdl_number')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Commercial Driver License number"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            {...register('phone')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="(555) 555-5555"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            {...register('email')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="driver@example.com"
          />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
        >
          Back
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSkip}
            disabled={isPending}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            I drive myself (skip)
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {isPending ? 'Saving...' : 'Next'}
          </button>
        </div>
      </div>
    </form>
  )
}
