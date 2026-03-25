'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { vehicleSchema, type VehicleInput } from '@/schemas/vehicle'
import { useState } from 'react'
import Link from 'next/link'
import { VEHICLE_CLASS_LABELS } from '@/lib/fleet/fleet-helpers'
import { StatusBadge } from '@/components/ui/status-badge'

const VEHICLE_TYPES = [
  { value: 'dry_van', label: 'Dry Van' },
  { value: 'reefer', label: 'Reefer' },
  { value: 'flatbed', label: 'Flatbed' },
  { value: 'sprinter', label: 'Sprinter' },
  { value: 'box_truck', label: 'Box Truck' },
  { value: 'medical_van', label: 'Medical Van' },
  { value: 'hotshot', label: 'Hotshot' },
  { value: 'straight_truck', label: 'Straight Truck' },
  { value: 'day_cab', label: 'Day Cab' },
  { value: 'sleeper', label: 'Sleeper' },
  { value: 'tanker', label: 'Tanker' },
  { value: 'dry_van_trailer', label: 'Dry Van Trailer' },
  { value: 'flatbed_trailer', label: 'Flatbed Trailer' },
  { value: 'reefer_trailer', label: 'Reefer Trailer' },
  { value: 'step_deck_trailer', label: 'Step Deck Trailer' },
  { value: 'other', label: 'Other' },
] as const

const FUEL_TYPES = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'gasoline', label: 'Gasoline' },
  { value: 'cng', label: 'CNG' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
] as const

const VEHICLE_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'in_shop', label: 'In Shop' },
  { value: 'out_of_service', label: 'Out of Service' },
  { value: 'parked', label: 'Parked' },
  { value: 'sold', label: 'Sold' },
  { value: 'totaled', label: 'Totaled' },
] as const

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
] as const

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
const labelClass = 'block text-sm font-medium mb-1'

interface VehicleFormProps {
  defaultValues?: Partial<VehicleInput>
  action: (formData: FormData) => Promise<{ error?: { form: string[] } } | void>
  isEdit?: boolean
}

export function VehicleForm({ defaultValues, action, isEdit = false }: VehicleFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPurchase, setShowPurchase] = useState(isEdit)
  const {
    register,
    handleSubmit,
    watch,
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
      vehicle_class: 'other',
      fuel_type: 'diesel',
      status: 'active',
      ...defaultValues,
    },
  })

  const currentStatus = watch('status')

  async function onSubmit(data: VehicleInput) {
    setServerError(null)
    const formData = new FormData()
    formData.append('unit_number', data.unit_number)
    formData.append('vin', data.vin ?? '')
    formData.append('year', String(data.year))
    formData.append('make', data.make)
    formData.append('model', data.model)
    formData.append('vehicle_type', data.vehicle_type)
    formData.append('vehicle_class', data.vehicle_class ?? 'other')
    formData.append('fuel_type', data.fuel_type ?? 'diesel')
    formData.append('status', data.status ?? 'active')
    formData.append('license_plate', data.license_plate ?? '')
    formData.append('license_state', data.license_state ?? '')
    formData.append('registration_expiry', data.registration_expiry ?? '')
    formData.append('current_odometer', data.current_odometer != null ? String(data.current_odometer) : '')
    formData.append('purchase_date', data.purchase_date ?? '')
    formData.append('purchase_price', data.purchase_price != null ? String(data.purchase_price) : '')
    formData.append('current_value', data.current_value != null ? String(data.current_value) : '')
    formData.append('insurance_policy', data.insurance_policy ?? '')
    formData.append('notes', data.notes ?? '')

    const result = await action(formData)
    if (result?.error?.form) {
      setServerError(result.error.form[0])
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {/* Vehicle Info */}
      <fieldset>
        <legend className="text-base font-semibold text-gray-900 mb-3">Vehicle Info</legend>
        <div className="space-y-4">
          <div>
            <label htmlFor="unit_number" className={labelClass}>Unit Number *</label>
            <input id="unit_number" type="text" {...register('unit_number')} className={inputClass} placeholder="e.g. T-101" />
            {errors.unit_number && <p className="mt-1 text-sm text-red-600">{errors.unit_number.message}</p>}
          </div>

          <div>
            <label htmlFor="vin" className={labelClass}>VIN</label>
            <input id="vin" type="text" maxLength={17} {...register('vin')} className={`${inputClass} font-mono`} placeholder="17-character VIN" />
            {errors.vin && <p className="mt-1 text-sm text-red-600">{errors.vin.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="year" className={labelClass}>Year *</label>
              <input id="year" type="number" {...register('year')} className={inputClass} placeholder="2024" />
              {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>}
            </div>
            <div>
              <label htmlFor="make" className={labelClass}>Make *</label>
              <input id="make" type="text" {...register('make')} className={inputClass} placeholder="Freightliner" />
              {errors.make && <p className="mt-1 text-sm text-red-600">{errors.make.message}</p>}
            </div>
            <div>
              <label htmlFor="model" className={labelClass}>Model *</label>
              <input id="model" type="text" {...register('model')} className={inputClass} placeholder="Cascadia" />
              {errors.model && <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>}
            </div>
          </div>
        </div>
      </fieldset>

      {/* Classification */}
      <fieldset>
        <legend className="text-base font-semibold text-gray-900 mb-3">Classification</legend>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="vehicle_class" className={labelClass}>Class</label>
            <select id="vehicle_class" {...register('vehicle_class')} className={`${inputClass} bg-white`}>
              {Object.entries(VEHICLE_CLASS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {errors.vehicle_class && <p className="mt-1 text-sm text-red-600">{errors.vehicle_class.message}</p>}
          </div>
          <div>
            <label htmlFor="fuel_type" className={labelClass}>Fuel Type</label>
            <select id="fuel_type" {...register('fuel_type')} className={`${inputClass} bg-white`}>
              {FUEL_TYPES.map((ft) => (
                <option key={ft.value} value={ft.value}>{ft.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="vehicle_type" className={labelClass}>Type *</label>
          <select id="vehicle_type" {...register('vehicle_type')} className={`${inputClass} bg-white`}>
            {VEHICLE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          {errors.vehicle_type && <p className="mt-1 text-sm text-red-600">{errors.vehicle_type.message}</p>}
        </div>
      </fieldset>

      {/* Registration */}
      <fieldset>
        <legend className="text-base font-semibold text-gray-900 mb-3">Registration</legend>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="license_plate" className={labelClass}>License Plate</label>
            <input id="license_plate" type="text" {...register('license_plate')} className={`${inputClass} uppercase`} placeholder="ABC-1234" />
          </div>
          <div>
            <label htmlFor="license_state" className={labelClass}>State</label>
            <select id="license_state" {...register('license_state')} className={`${inputClass} bg-white`}>
              <option value="">Select state</option>
              {US_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="registration_expiry" className={labelClass}>Registration Expiry</label>
          <input id="registration_expiry" type="date" {...register('registration_expiry')} className={inputClass} />
        </div>
      </fieldset>

      {/* Odometer */}
      <fieldset>
        <legend className="text-base font-semibold text-gray-900 mb-3">Odometer &amp; Performance</legend>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="current_odometer" className={labelClass}>Current Odometer</label>
            <input id="current_odometer" type="number" {...register('current_odometer')} className={inputClass} placeholder="0" />
          </div>
          <div>
            <label htmlFor="avg_mpg" className={labelClass}>Avg MPG</label>
            <input id="avg_mpg" type="number" step="0.01" {...register('avg_mpg')} className={`${inputClass} bg-gray-50`} readOnly={!!defaultValues?.avg_mpg} placeholder="--" />
            <p className="mt-1 text-xs text-gray-500">Auto-calculated from fuel logs when available</p>
          </div>
        </div>
      </fieldset>

      {/* Purchase & Value (collapsible) */}
      <fieldset>
        <button
          type="button"
          onClick={() => setShowPurchase(!showPurchase)}
          className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-3 hover:text-gray-700 transition-colors"
        >
          <span className={`transform transition-transform ${showPurchase ? 'rotate-90' : ''}`}>&#9654;</span>
          Purchase &amp; Value
        </button>
        {showPurchase && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="purchase_date" className={labelClass}>Purchase Date</label>
                <input id="purchase_date" type="date" {...register('purchase_date')} className={inputClass} />
              </div>
              <div>
                <label htmlFor="purchase_price" className={labelClass}>Purchase Price ($)</label>
                <input id="purchase_price" type="number" step="0.01" {...register('purchase_price')} className={inputClass} placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="current_value" className={labelClass}>Current Value ($)</label>
                <input id="current_value" type="number" step="0.01" {...register('current_value')} className={inputClass} placeholder="0.00" />
              </div>
              <div>
                <label htmlFor="insurance_policy" className={labelClass}>Insurance Policy</label>
                <input id="insurance_policy" type="text" {...register('insurance_policy')} className={inputClass} placeholder="Policy number" />
              </div>
            </div>
          </div>
        )}
      </fieldset>

      {/* Status (edit mode only) */}
      {isEdit && (
        <fieldset>
          <legend className="text-base font-semibold text-gray-900 mb-3">Status</legend>
          <div className="flex items-center gap-4">
            <select id="status" {...register('status')} className={`${inputClass} bg-white max-w-xs`}>
              {VEHICLE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {currentStatus && (
              <StatusBadge status={currentStatus} variant="vehicle" />
            )}
          </div>
        </fieldset>
      )}

      {/* Notes */}
      <fieldset>
        <legend className="text-base font-semibold text-gray-900 mb-3">Notes</legend>
        <textarea
          id="notes"
          {...register('notes')}
          rows={3}
          className={inputClass}
          placeholder="Any additional notes about this vehicle..."
        />
      </fieldset>

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
