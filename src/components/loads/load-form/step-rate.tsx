'use client'

import { useFormContext } from 'react-hook-form'
import type { LoadInput } from '@/schemas/load'

const RATE_TYPES = [
  { value: 'flat', label: 'Flat Rate' },
  { value: 'per_mile', label: 'Per Mile' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'per_stop', label: 'Per Stop' },
] as const

export function StepRate() {
  const { register, watch, formState: { errors } } = useFormContext<LoadInput>()

  const rate = Number(watch('rate_amount')) || 0
  const fuelSurcharge = Number(watch('fuel_surcharge')) || 0
  const accessorial = Number(watch('accessorial_charges')) || 0
  const total = rate + fuelSurcharge + accessorial

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Rate</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="rate_amount" className="block text-sm font-medium mb-1">
              Rate *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                id="rate_amount"
                type="number"
                step="0.01"
                {...register('rate_amount')}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            {errors.rate_amount && (
              <p className="mt-1 text-sm text-red-600">{errors.rate_amount.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="rate_type" className="block text-sm font-medium mb-1">
              Rate Type
            </label>
            <select
              id="rate_type"
              {...register('rate_type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            >
              {RATE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="miles" className="block text-sm font-medium mb-1">
              Estimated Miles
            </label>
            <input
              id="miles"
              type="number"
              {...register('miles')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="500"
            />
          </div>

          <div>
            <label htmlFor="fuel_surcharge" className="block text-sm font-medium mb-1">
              Fuel Surcharge
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                id="fuel_surcharge"
                type="number"
                step="0.01"
                {...register('fuel_surcharge')}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label htmlFor="accessorial_charges" className="block text-sm font-medium mb-1">
              Accessorial
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                id="accessorial_charges"
                type="number"
                step="0.01"
                {...register('accessorial_charges')}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Rate</span>
            <span>${rate.toFixed(2)}</span>
          </div>
          {fuelSurcharge > 0 && (
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>Fuel Surcharge</span>
              <span>${fuelSurcharge.toFixed(2)}</span>
            </div>
          )}
          {accessorial > 0 && (
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>Accessorial</span>
              <span>${accessorial.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold text-gray-900 mt-2 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Broker Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="broker_name" className="block text-sm font-medium mb-1">
              Broker Name
            </label>
            <input
              id="broker_name"
              type="text"
              {...register('broker_name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="broker_mc_number" className="block text-sm font-medium mb-1">
              MC Number
            </label>
            <input
              id="broker_mc_number"
              type="text"
              {...register('broker_mc_number')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
              placeholder="MC-123456"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="broker_contact" className="block text-sm font-medium mb-1">
              Contact Name
            </label>
            <input
              id="broker_contact"
              type="text"
              {...register('broker_contact')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="broker_phone" className="block text-sm font-medium mb-1">
              Phone
            </label>
            <input
              id="broker_phone"
              type="tel"
              {...register('broker_phone')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="broker_email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="broker_email"
              type="email"
              {...register('broker_email')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {errors.broker_email && (
              <p className="mt-1 text-sm text-red-600">{errors.broker_email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="broker_reference" className="block text-sm font-medium mb-1">
              Reference #
            </label>
            <input
              id="broker_reference"
              type="text"
              {...register('broker_reference')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
