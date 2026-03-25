'use client'

import { useState, useTransition } from 'react'
import { Shield } from 'lucide-react'
import { upsertComplianceProfile } from '@/lib/compliance/actions'
import type { CarrierType } from '@/types/database'

interface ComplianceSetupProps {
  dotNumber?: string
  mcNumber?: string
  companyType?: string
}

const CARRIER_TYPE_OPTIONS: { value: CarrierType; label: string }[] = [
  { value: 'medical_transport', label: 'Medical Transport' },
  { value: 'box_truck', label: 'Box Truck' },
  { value: 'hotshot', label: 'Hotshot' },
  { value: 'straight_truck', label: 'Straight Truck' },
  { value: 'class_8', label: 'Class 8 / Semi' },
  { value: 'mixed_fleet', label: 'Mixed Fleet' },
]

function inferDotRegulated(companyType?: string): boolean {
  return companyType === 'dot_carrier' || companyType === 'both'
}

export function ComplianceSetup({ dotNumber, mcNumber, companyType }: ComplianceSetupProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isDot, setIsDot] = useState(inferDotRegulated(companyType))
  const [carrierType, setCarrierType] = useState<CarrierType>('box_truck')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await upsertComplianceProfile({
        carrier_type: carrierType,
        is_dot_regulated: isDot,
        dot_number: formData.get('dot_number') as string || null,
        mc_number: formData.get('mc_number') as string || null,
      })
      if (result.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="rounded-lg border bg-white p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Set Up Compliance Tracking</h2>
        <p className="text-sm text-gray-500 mb-6">
          Configure your compliance profile to track regulatory obligations, deadlines, and driver qualifications.
        </p>

        <form onSubmit={handleSubmit} className="text-left space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Carrier Type</label>
            <select
              value={carrierType}
              onChange={(e) => setCarrierType(e.target.value as CarrierType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
            >
              {CARRIER_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_dot"
              checked={isDot}
              onChange={(e) => setIsDot(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="is_dot" className="text-sm font-medium text-gray-700">
              DOT Regulated Carrier
            </label>
          </div>

          {isDot && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DOT Number</label>
                <input
                  type="text"
                  name="dot_number"
                  defaultValue={dotNumber ?? ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MC Number</label>
                <input
                  type="text"
                  name="mc_number"
                  defaultValue={mcNumber ?? ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? 'Setting up...' : 'Set Up Compliance'}
          </button>
        </form>
      </div>
    </div>
  )
}
