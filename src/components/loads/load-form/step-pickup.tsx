'use client'

import { useFormContext } from 'react-hook-form'
import type { LoadInput } from '@/schemas/load'

export function StepPickup() {
  const { register, formState: { errors } } = useFormContext<LoadInput>()

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Pickup Details</h2>

      <div>
        <label htmlFor="pickup_company" className="block text-sm font-medium mb-1">
          Company Name *
        </label>
        <input
          id="pickup_company"
          type="text"
          {...register('pickup_company')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="ABC Warehouse"
        />
        {errors.pickup_company && (
          <p className="mt-1 text-sm text-red-600">{errors.pickup_company.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="pickup_address" className="block text-sm font-medium mb-1">
          Address *
        </label>
        <input
          id="pickup_address"
          type="text"
          {...register('pickup_address')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="123 Main St"
        />
        {errors.pickup_address && (
          <p className="mt-1 text-sm text-red-600">{errors.pickup_address.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="pickup_city" className="block text-sm font-medium mb-1">
            City *
          </label>
          <input
            id="pickup_city"
            type="text"
            {...register('pickup_city')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Chicago"
          />
          {errors.pickup_city && (
            <p className="mt-1 text-sm text-red-600">{errors.pickup_city.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="pickup_state" className="block text-sm font-medium mb-1">
            State *
          </label>
          <input
            id="pickup_state"
            type="text"
            maxLength={2}
            {...register('pickup_state')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent uppercase"
            placeholder="IL"
          />
          {errors.pickup_state && (
            <p className="mt-1 text-sm text-red-600">{errors.pickup_state.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="pickup_zip" className="block text-sm font-medium mb-1">
            Zip *
          </label>
          <input
            id="pickup_zip"
            type="text"
            maxLength={10}
            {...register('pickup_zip')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="60601"
          />
          {errors.pickup_zip && (
            <p className="mt-1 text-sm text-red-600">{errors.pickup_zip.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="pickup_date" className="block text-sm font-medium mb-1">
            Date *
          </label>
          <input
            id="pickup_date"
            type="date"
            {...register('pickup_date')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {errors.pickup_date && (
            <p className="mt-1 text-sm text-red-600">{errors.pickup_date.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="pickup_time" className="block text-sm font-medium mb-1">
            Time
          </label>
          <input
            id="pickup_time"
            type="time"
            {...register('pickup_time')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="pickup_contact_name" className="block text-sm font-medium mb-1">
            Contact Name
          </label>
          <input
            id="pickup_contact_name"
            type="text"
            {...register('pickup_contact_name')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="pickup_contact_phone" className="block text-sm font-medium mb-1">
            Contact Phone
          </label>
          <input
            id="pickup_contact_phone"
            type="tel"
            {...register('pickup_contact_phone')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label htmlFor="pickup_reference" className="block text-sm font-medium mb-1">
          Reference / PO Number
        </label>
        <input
          id="pickup_reference"
          type="text"
          {...register('pickup_reference')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="PO-12345"
        />
      </div>

      <div>
        <label htmlFor="pickup_notes" className="block text-sm font-medium mb-1">
          Pickup Notes
        </label>
        <textarea
          id="pickup_notes"
          rows={2}
          {...register('pickup_notes')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Special instructions..."
        />
      </div>
    </div>
  )
}
