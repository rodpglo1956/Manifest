'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DVIR_INSPECTION_ITEMS, dvirSchema } from '@/lib/compliance/dvir-schema'
import { submitDVIR } from '@/lib/compliance/actions'
import { CheckCircle2, XCircle, Camera, Loader2 } from 'lucide-react'

type DVIRFormValues = z.input<typeof dvirSchema>

// Group items by category for visual organization
const ITEM_GROUPS = [
  {
    label: 'Safety',
    items: ['service_brakes', 'parking_brake', 'steering'],
  },
  {
    label: 'Visibility',
    items: ['lighting', 'wipers', 'mirrors'],
  },
  {
    label: 'Mechanical',
    items: ['tires', 'wheels_rims', 'coupling'],
  },
  {
    label: 'Emergency',
    items: ['horn', 'emergency_equipment'],
  },
]

interface DVIRFormProps {
  vehicleId: string
  vehicleInfo: { unit_number: string; year?: number | null; make?: string | null; model?: string | null }
  onComplete?: () => void
}

export function DVIRForm({ vehicleId, vehicleInfo, onComplete }: DVIRFormProps) {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // Build default items: all pass
  const defaultItems: Record<string, 'pass' | 'fail'> = {}
  for (const item of DVIR_INSPECTION_ITEMS) {
    defaultItems[item.id] = 'pass'
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DVIRFormValues>({
    resolver: zodResolver(dvirSchema),
    defaultValues: {
      vehicle_id: vehicleId,
      inspection_type: 'pre_trip',
      items: defaultItems,
      defects: [],
      notes: '',
      odometer: undefined,
    },
  })

  const items = watch('items')
  const defects = watch('defects')
  const inspectionType = watch('inspection_type')

  // Toggle an item between pass/fail
  function toggleItem(itemId: string, value: 'pass' | 'fail') {
    const currentItems = { ...items }
    currentItems[itemId] = value
    setValue('items', currentItems, { shouldValidate: true })

    // Manage defects array
    const currentDefects = [...(defects || [])]
    if (value === 'fail') {
      // Add defect entry if not exists
      if (!currentDefects.find((d) => d.item_id === itemId)) {
        currentDefects.push({ item_id: itemId, description: '' })
      }
    } else {
      // Remove defect entry
      const idx = currentDefects.findIndex((d) => d.item_id === itemId)
      if (idx >= 0) currentDefects.splice(idx, 1)
    }
    setValue('defects', currentDefects, { shouldValidate: true })
  }

  function updateDefectDescription(itemId: string, description: string) {
    const currentDefects = [...(defects || [])]
    const idx = currentDefects.findIndex((d) => d.item_id === itemId)
    if (idx >= 0) {
      currentDefects[idx] = { ...currentDefects[idx], description }
      setValue('defects', currentDefects, { shouldValidate: true })
    }
  }

  function onSubmit(data: DVIRFormValues) {
    setServerError(null)
    startTransition(async () => {
      const result = await submitDVIR(data)
      if (result.error) {
        setServerError(result.error)
      } else {
        setSuccess(true)
        onComplete?.()
      }
    })
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-green-800">Inspection Submitted</h3>
        <p className="text-green-600 text-sm mt-1">Your DVIR has been recorded successfully.</p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 text-sm text-green-700 underline"
        >
          Submit another inspection
        </button>
      </div>
    )
  }

  // Find item label by id
  const itemMap = new Map(DVIR_INSPECTION_ITEMS.map((i) => [i.id, i.label]))

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Vehicle Info */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-500">Vehicle</p>
        <p className="font-semibold text-gray-900">
          {vehicleInfo.unit_number}
          {vehicleInfo.year || vehicleInfo.make || vehicleInfo.model
            ? ` - ${[vehicleInfo.year, vehicleInfo.make, vehicleInfo.model].filter(Boolean).join(' ')}`
            : ''}
        </p>
      </div>

      {/* Inspection Type Toggle */}
      <div className="flex rounded-lg overflow-hidden border border-gray-200">
        <button
          type="button"
          onClick={() => setValue('inspection_type', 'pre_trip')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            inspectionType === 'pre_trip'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Pre-Trip
        </button>
        <button
          type="button"
          onClick={() => setValue('inspection_type', 'post_trip')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            inspectionType === 'post_trip'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Post-Trip
        </button>
      </div>

      {/* Odometer */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Odometer (optional)</label>
        <input
          type="number"
          {...register('odometer', { valueAsNumber: true })}
          placeholder="Current mileage"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Inspection Items */}
      {ITEM_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((itemId) => {
              const label = itemMap.get(itemId) ?? itemId
              const status = items?.[itemId] ?? 'pass'
              const defect = defects?.find((d) => d.item_id === itemId)

              return (
                <div key={itemId}>
                  <div className="flex items-center gap-2 py-2">
                    <span className="flex-1 text-sm text-gray-800">{label}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => toggleItem(itemId, 'pass')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          status === 'pass'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-green-50'
                        }`}
                      >
                        PASS
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleItem(itemId, 'fail')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          status === 'fail'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-red-50'
                        }`}
                      >
                        FAIL
                      </button>
                    </div>
                  </div>

                  {/* Defect description - slides down on fail */}
                  {status === 'fail' && defect && (
                    <div className="ml-2 mb-2">
                      <input
                        type="text"
                        placeholder="Describe the defect..."
                        value={defect.description}
                        onChange={(e) => updateDefectDescription(itemId, e.target.value)}
                        className="w-full rounded border border-red-200 px-3 py-1.5 text-sm bg-red-50 focus:ring-2 focus:ring-red-300 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Notes */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Notes (optional)</label>
        <textarea
          {...register('notes')}
          rows={2}
          placeholder="Additional notes..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Validation errors */}
      {errors.items && (
        <p className="text-sm text-red-600">{String(errors.items.message ?? 'All items must be completed')}</p>
      )}
      {errors.defects && (
        <p className="text-sm text-red-600">Each failed item must have a defect description</p>
      )}
      {errors.root && (
        <p className="text-sm text-red-600">{errors.root.message}</p>
      )}
      {serverError && (
        <p className="text-sm text-red-600">{serverError}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 rounded-lg bg-primary text-white font-semibold text-base hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting...
          </span>
        ) : (
          'Submit Inspection'
        )}
      </button>
    </form>
  )
}
