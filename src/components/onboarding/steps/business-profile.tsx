'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import {
  businessProfileSchema,
  type BusinessProfileInput,
  type OnboardingCarrierType,
  type FleetSizeRange,
} from '@/lib/onboarding/schemas'
import { saveBusinessProfile } from '@/lib/onboarding/actions'

const CARRIER_TYPES: { value: OnboardingCarrierType; label: string }[] = [
  { value: 'medical_transport', label: 'Medical Transport' },
  { value: 'trucking', label: 'Trucking' },
  { value: 'mixed_fleet', label: 'Mixed Fleet' },
  { value: 'courier', label: 'Courier / Last Mile' },
  { value: 'other', label: 'Other' },
]

const FLEET_SIZES: { value: FleetSizeRange; label: string }[] = [
  { value: '1-5', label: '1-5 vehicles' },
  { value: '6-20', label: '6-20 vehicles' },
  { value: '21-50', label: '21-50 vehicles' },
  { value: '51+', label: '51+ vehicles' },
]

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
]

interface BusinessProfileStepProps {
  onNext: (fleetSize: string) => void
}

export function BusinessProfileStep({ onNext }: BusinessProfileStepProps) {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<BusinessProfileInput>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      company_name: '',
      address_line1: '',
      address_city: '',
      address_state: '',
      address_zip: '',
      carrier_type: 'trucking',
      dot_number: '',
      fleet_size_range: '1-5',
    },
  })

  const fleetSize = watch('fleet_size_range')

  const onSubmit = (data: BusinessProfileInput) => {
    startTransition(async () => {
      const result = await saveBusinessProfile(data)
      if (result?.error) {
        setError('root', { message: result.error })
        return
      }
      onNext(fleetSize ?? '1-5')
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Business Profile</h2>
        <p className="text-sm text-gray-500 mt-1">Tell us about your operation</p>
      </div>

      {errors.root && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md">{errors.root.message}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register('company_name')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Your company name"
        />
        {errors.company_name && (
          <p className="text-sm text-red-600 mt-1">{errors.company_name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
        <input
          {...register('address_line1')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="123 Main St"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            {...register('address_city')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <select
            {...register('address_state')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">--</option>
            {US_STATES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
          <input
            {...register('address_zip')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Carrier Type <span className="text-red-500">*</span>
        </label>
        <select
          {...register('carrier_type')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {CARRIER_TYPES.map(ct => (
            <option key={ct.value} value={ct.value}>{ct.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">DOT Number (optional)</label>
        <input
          {...register('dot_number')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., 1234567"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fleet Size <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {FLEET_SIZES.map(fs => (
            <label
              key={fs.value}
              className="flex items-center gap-2 p-3 border border-gray-300 rounded-md cursor-pointer hover:border-blue-400 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
            >
              <input
                type="radio"
                {...register('fleet_size_range')}
                value={fs.value}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{fs.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4">
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
