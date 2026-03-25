'use client'

import { useFormContext } from 'react-hook-form'
import type { LoadInput } from '@/schemas/load'

export function StepDelivery() {
  const { register, formState: { errors } } = useFormContext<LoadInput>()

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Delivery Details</h2>

      <div>
        <label htmlFor="delivery_company" className="block text-sm font-medium mb-1">
          Company Name *
        </label>
        <input
          id="delivery_company"
          type="text"
          {...register('delivery_company')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="XYZ Distribution"
        />
        {errors.delivery_company && (
          <p className="mt-1 text-sm text-red-600">{errors.delivery_company.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="delivery_address" className="block text-sm font-medium mb-1">
          Address *
        </label>
        <input
          id="delivery_address"
          type="text"
          {...register('delivery_address')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="456 Oak Ave"
        />
        {errors.delivery_address && (
          <p className="mt-1 text-sm text-red-600">{errors.delivery_address.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="delivery_city" className="block text-sm font-medium mb-1">
            City *
          </label>
          <input
            id="delivery_city"
            type="text"
            {...register('delivery_city')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Dallas"
          />
          {errors.delivery_city && (
            <p className="mt-1 text-sm text-red-600">{errors.delivery_city.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="delivery_state" className="block text-sm font-medium mb-1">
            State *
          </label>
          <input
            id="delivery_state"
            type="text"
            maxLength={2}
            {...register('delivery_state')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent uppercase"
            placeholder="TX"
          />
          {errors.delivery_state && (
            <p className="mt-1 text-sm text-red-600">{errors.delivery_state.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="delivery_zip" className="block text-sm font-medium mb-1">
            Zip *
          </label>
          <input
            id="delivery_zip"
            type="text"
            maxLength={10}
            {...register('delivery_zip')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="75201"
          />
          {errors.delivery_zip && (
            <p className="mt-1 text-sm text-red-600">{errors.delivery_zip.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="delivery_date" className="block text-sm font-medium mb-1">
            Date *
          </label>
          <input
            id="delivery_date"
            type="date"
            {...register('delivery_date')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {errors.delivery_date && (
            <p className="mt-1 text-sm text-red-600">{errors.delivery_date.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="delivery_time" className="block text-sm font-medium mb-1">
            Time
          </label>
          <input
            id="delivery_time"
            type="time"
            {...register('delivery_time')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="delivery_contact_name" className="block text-sm font-medium mb-1">
            Contact Name
          </label>
          <input
            id="delivery_contact_name"
            type="text"
            {...register('delivery_contact_name')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="delivery_contact_phone" className="block text-sm font-medium mb-1">
            Contact Phone
          </label>
          <input
            id="delivery_contact_phone"
            type="tel"
            {...register('delivery_contact_phone')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label htmlFor="delivery_reference" className="block text-sm font-medium mb-1">
          Reference / PO Number
        </label>
        <input
          id="delivery_reference"
          type="text"
          {...register('delivery_reference')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="DEL-67890"
        />
      </div>

      <div>
        <label htmlFor="delivery_notes" className="block text-sm font-medium mb-1">
          Delivery Notes
        </label>
        <textarea
          id="delivery_notes"
          rows={2}
          {...register('delivery_notes')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Special instructions..."
        />
      </div>
    </div>
  )
}
