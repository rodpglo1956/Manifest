'use client'

import { useTransition, useState, useRef, useEffect } from 'react'
import { createFuelTransaction } from '@/lib/fleet/actions'

interface DriverFuelFormProps {
  vehicleId: string
  driverId: string
  onClose: () => void
}

export function DriverFuelForm({ vehicleId, driverId, onClose }: DriverFuelFormProps) {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const formRef = useRef<HTMLFormElement>(null)

  // Auto-calculated price per gallon
  const [gallons, setGallons] = useState('')
  const [totalCost, setTotalCost] = useState('')

  const pricePerGallon =
    gallons && totalCost && parseFloat(gallons) > 0
      ? (parseFloat(totalCost) / parseFloat(gallons)).toFixed(3)
      : '--'

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [success, onClose])

  function handleSubmit(formData: FormData) {
    setErrors([])
    startTransition(async () => {
      const result = await createFuelTransaction(formData)
      if (result.error) {
        setErrors(result.error.form)
      } else {
        setSuccess(true)
        formRef.current?.reset()
        setGallons('')
        setTotalCost('')
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h3 className="text-base font-semibold text-blue-900">Log Fuel</h3>

      <input type="hidden" name="vehicle_id" value={vehicleId} />
      <input type="hidden" name="driver_id" value={driverId} />
      <input type="hidden" name="source" value="manual" />
      <input type="hidden" name="transaction_date" value={new Date().toISOString().split('T')[0]} />

      {errors.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          {errors.map((e, i) => (
            <p key={i} className="text-sm text-red-700">{e}</p>
          ))}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">Fuel logged successfully!</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="gallons" className="block text-sm font-medium text-gray-700 mb-1">
            Gallons *
          </label>
          <input
            id="gallons"
            name="gallons"
            type="number"
            step="0.001"
            min="0"
            required
            value={gallons}
            onChange={(e) => setGallons(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.000"
          />
        </div>

        <div>
          <label htmlFor="total_cost" className="block text-sm font-medium text-gray-700 mb-1">
            Total Cost *
          </label>
          <input
            id="total_cost"
            name="total_cost"
            type="number"
            step="0.01"
            min="0"
            required
            value={totalCost}
            onChange={(e) => setTotalCost(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="$0.00"
          />
        </div>
      </div>

      <div className="text-sm text-gray-600">
        Price per gallon: <span className="font-medium">{pricePerGallon !== '--' ? `$${pricePerGallon}` : '--'}</span>
        {pricePerGallon !== '--' && (
          <input type="hidden" name="price_per_gallon" value={pricePerGallon} />
        )}
      </div>

      <div>
        <label htmlFor="odometer_reading" className="block text-sm font-medium text-gray-700 mb-1">
          Odometer Reading *
        </label>
        <input
          id="odometer_reading"
          name="odometer_reading"
          type="number"
          min="0"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Current mileage"
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
          Location
        </label>
        <input
          id="location"
          name="location"
          type="text"
          className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Station name or address"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <input
            id="city"
            name="city"
            type="text"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="City"
          />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
            State
          </label>
          <input
            id="state"
            name="state"
            type="text"
            maxLength={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="ST"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium text-base hover:bg-blue-700 disabled:opacity-50 min-h-[44px]"
        >
          {isPending ? 'Saving...' : 'Log Fuel'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium text-base hover:bg-gray-50 min-h-[44px]"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
