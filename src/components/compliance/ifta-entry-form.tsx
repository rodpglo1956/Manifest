'use client'

import { useState, useTransition } from 'react'
import { upsertIFTARecord } from '@/lib/compliance/actions'
import type { Vehicle } from '@/types/database'

interface IFTAEntryFormProps {
  vehicles: Vehicle[]
  currentQuarter: string
  onSuccess?: () => void
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

const CA_PROVINCES = [
  'AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT',
]

const JURISDICTIONS = [...US_STATES, ...CA_PROVINCES].sort()

function getQuarterOptions(): string[] {
  const now = new Date()
  const year = now.getFullYear()
  const options: string[] = []
  for (let y = year - 1; y <= year; y++) {
    for (let q = 1; q <= 4; q++) {
      options.push(`${y}-Q${q}`)
    }
  }
  return options
}

export function IFTAEntryForm({ vehicles, currentQuarter, onSuccess }: IFTAEntryFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [vehicleId, setVehicleId] = useState('')
  const [quarter, setQuarter] = useState(currentQuarter)
  const [jurisdiction, setJurisdiction] = useState('')
  const [miles, setMiles] = useState('')
  const [gallons, setGallons] = useState('')
  const [taxRate, setTaxRate] = useState('')

  const quarterOptions = getQuarterOptions()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!vehicleId || !quarter || !jurisdiction) {
      setError('Vehicle, quarter, and jurisdiction are required')
      return
    }

    startTransition(async () => {
      const res = await upsertIFTARecord({
        vehicle_id: vehicleId,
        quarter,
        jurisdiction,
        miles_traveled: parseFloat(miles) || 0,
        gallons_purchased: parseFloat(gallons) || 0,
        tax_rate: parseFloat(taxRate) || 0,
      })

      if (res.error) {
        setError(res.error)
      } else {
        setVehicleId('')
        setJurisdiction('')
        setMiles('')
        setGallons('')
        setTaxRate('')
        onSuccess?.()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-4 space-y-4 bg-white">
      <h3 className="text-sm font-semibold text-gray-900">Add IFTA Entry</h3>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle *</label>
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Select vehicle</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.unit_number}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Quarter *</label>
          <select
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {quarterOptions.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Jurisdiction *</label>
          <select
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Select state/province</option>
            {JURISDICTIONS.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Miles Traveled</label>
          <input
            type="number"
            step="0.01"
            value={miles}
            onChange={(e) => setMiles(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Gallons Purchased</label>
          <input
            type="number"
            step="0.001"
            value={gallons}
            onChange={(e) => setGallons(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tax Rate (per gallon)</label>
          <input
            type="number"
            step="0.0001"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover disabled:opacity-50"
      >
        {isPending ? 'Saving...' : 'Save Entry'}
      </button>
    </form>
  )
}
