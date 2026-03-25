'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { driverSchema, type DriverInput } from '@/schemas/driver'

interface DriverFormProps {
  defaultValues?: Partial<DriverInput>
  action: (formData: FormData) => Promise<{ error?: { form: string[] } } | void>
  submitLabel?: string
  showStatus?: boolean
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'

export function DriverForm({
  defaultValues,
  action,
  submitLabel = 'Save Driver',
  showStatus = false,
}: DriverFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DriverInput>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      license_number: '',
      license_state: '',
      license_expiration: '',
      hire_date: '',
      status: 'active',
      home_terminal: '',
      notes: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      ...defaultValues,
    },
  })

  async function onSubmit(data: DriverInput) {
    setServerError(null)
    const formData = new FormData()

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })

    const result = await action(formData)
    if (result?.error?.form) {
      setServerError(result.error.form[0])
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Personal Info
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              id="first_name"
              type="text"
              {...register('first_name')}
              className={inputClass}
              placeholder="John"
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              id="last_name"
              type="text"
              {...register('last_name')}
              className={inputClass}
              placeholder="Doe"
            />
            {errors.last_name && (
              <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className={inputClass}
              placeholder="john.doe@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              {...register('phone')}
              className={inputClass}
              placeholder="555-123-4567"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* License Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          License Info
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="license_number" className="block text-sm font-medium mb-1">
              License Number
            </label>
            <input
              id="license_number"
              type="text"
              {...register('license_number')}
              className={`${inputClass} font-mono`}
              placeholder="DL123456"
            />
          </div>
          <div>
            <label htmlFor="license_state" className="block text-sm font-medium mb-1">
              License State
            </label>
            <input
              id="license_state"
              type="text"
              maxLength={2}
              {...register('license_state')}
              className={`${inputClass} uppercase`}
              placeholder="TX"
            />
            {errors.license_state && (
              <p className="mt-1 text-sm text-red-600">{errors.license_state.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="license_class" className="block text-sm font-medium mb-1">
              License Class
            </label>
            <select
              id="license_class"
              {...register('license_class')}
              className={inputClass}
            >
              <option value="">Select class</option>
              <option value="A">Class A</option>
              <option value="B">Class B</option>
              <option value="C">Class C</option>
              <option value="standard">Standard</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="license_expiration" className="block text-sm font-medium mb-1">
            License Expiration
          </label>
          <input
            id="license_expiration"
            type="date"
            {...register('license_expiration')}
            className={inputClass}
          />
        </div>
      </div>

      {/* Employment */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Employment
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="hire_date" className="block text-sm font-medium mb-1">
              Hire Date
            </label>
            <input
              id="hire_date"
              type="date"
              {...register('hire_date')}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="home_terminal" className="block text-sm font-medium mb-1">
              Home Terminal
            </label>
            <input
              id="home_terminal"
              type="text"
              {...register('home_terminal')}
              className={inputClass}
              placeholder="Dallas, TX"
            />
          </div>
        </div>

        {showStatus && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-1">
              Status
            </label>
            <select
              id="status"
              {...register('status')}
              className={inputClass}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        )}
      </div>

      {/* Emergency Contact */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Emergency Contact
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="emergency_contact_name" className="block text-sm font-medium mb-1">
              Contact Name
            </label>
            <input
              id="emergency_contact_name"
              type="text"
              {...register('emergency_contact_name')}
              className={inputClass}
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label htmlFor="emergency_contact_phone" className="block text-sm font-medium mb-1">
              Contact Phone
            </label>
            <input
              id="emergency_contact_phone"
              type="tel"
              {...register('emergency_contact_phone')}
              className={inputClass}
              placeholder="555-987-6543"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          {...register('notes')}
          className={inputClass}
          placeholder="Additional notes about this driver..."
        />
      </div>

      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{serverError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto px-6 py-2 bg-primary text-white font-medium rounded-md hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}
