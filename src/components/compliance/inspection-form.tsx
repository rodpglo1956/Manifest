'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { inspectionSchema, type InspectionInput } from '@/lib/compliance/compliance-schemas'
import { createInspection } from '@/lib/compliance/actions'
import type { Vehicle } from '@/types/database'

interface InspectionFormProps {
  vehicles: Vehicle[]
  onSuccess?: () => void
}

const INSPECTION_TYPES = [
  { value: 'annual_dot', label: 'Annual DOT' },
  { value: 'pre_trip', label: 'Pre-Trip' },
  { value: 'post_trip', label: 'Post-Trip' },
  { value: 'roadside', label: 'Roadside' },
  { value: 'state', label: 'State' },
  { value: 'customer_required', label: 'Customer Required' },
  { value: 'internal', label: 'Internal' },
] as const

const RESULTS = [
  { value: 'pass', label: 'Pass' },
  { value: 'fail', label: 'Fail' },
  { value: 'conditional', label: 'Conditional' },
] as const

export function InspectionForm({ vehicles, onSuccess }: InspectionFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [defects, setDefects] = useState<string[]>([])
  const [corrected, setCorrected] = useState<string[]>([])
  const [defectInput, setDefectInput] = useState('')
  const [correctedInput, setCorrectedInput] = useState('')

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<InspectionInput>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      vehicle_id: '',
      inspection_type: 'annual_dot',
      inspector_name: '',
      inspection_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      result: 'pass',
      notes: '',
    },
  })

  const result = watch('result')
  const inspectionType = watch('inspection_type')
  const showExpiry = inspectionType === 'annual_dot'
  const showDefects = result === 'fail' || result === 'conditional'

  function addDefect() {
    const trimmed = defectInput.trim()
    if (trimmed && !defects.includes(trimmed)) {
      setDefects([...defects, trimmed])
      setDefectInput('')
    }
  }

  function addCorrected() {
    const trimmed = correctedInput.trim()
    if (trimmed && !corrected.includes(trimmed)) {
      setCorrected([...corrected, trimmed])
      setCorrectedInput('')
    }
  }

  const onSubmit = (data: InspectionInput) => {
    setError(null)
    startTransition(async () => {
      const payload = {
        ...data,
        defects_found: defects.length > 0 ? defects : null,
        defects_corrected: corrected.length > 0 ? corrected : null,
        expiry_date: data.expiry_date || null,
        inspector_name: data.inspector_name || null,
        notes: data.notes || null,
      }

      const res = await createInspection(payload)
      if (res.error) {
        setError(res.error)
      } else {
        reset()
        setDefects([])
        setCorrected([])
        onSuccess?.()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="border border-gray-200 rounded-lg p-4 space-y-4 bg-white">
      <h3 className="text-sm font-semibold text-gray-900">Log Inspection</h3>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle *</label>
          <select
            {...register('vehicle_id')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Select vehicle</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.unit_number} {v.make ? `- ${v.make} ${v.model ?? ''}` : ''}
              </option>
            ))}
          </select>
          {errors.vehicle_id && <p className="text-xs text-red-600 mt-1">{errors.vehicle_id.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Inspection Type *</label>
          <select
            {...register('inspection_type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {INSPECTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Inspector Name</label>
          <input
            type="text"
            {...register('inspector_name')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Inspection Date *</label>
          <input
            type="date"
            {...register('inspection_date')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          {errors.inspection_date && <p className="text-xs text-red-600 mt-1">{errors.inspection_date.message}</p>}
        </div>

        {showExpiry && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label>
            <input
              type="date"
              {...register('expiry_date')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Result</label>
          <div className="flex gap-4 mt-1">
            {RESULTS.map((r) => (
              <label key={r.value} className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  value={r.value}
                  {...register('result')}
                  className="text-primary"
                />
                {r.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {showDefects && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Defects Found</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={defectInput}
                onChange={(e) => setDefectInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDefect() } }}
                placeholder="Describe defect..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <button
                type="button"
                onClick={addDefect}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Add
              </button>
            </div>
            {defects.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {defects.map((d, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs rounded-md">
                    {d}
                    <button
                      type="button"
                      onClick={() => setDefects(defects.filter((_, j) => j !== i))}
                      className="text-red-500 hover:text-red-700"
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {defects.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Defects Corrected</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={correctedInput}
                  onChange={(e) => setCorrectedInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCorrected() } }}
                  placeholder="Corrected defect..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <button
                  type="button"
                  onClick={addCorrected}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Add
                </button>
              </div>
              {corrected.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {corrected.map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md">
                      {c}
                      <button
                        type="button"
                        onClick={() => setCorrected(corrected.filter((_, j) => j !== i))}
                        className="text-green-500 hover:text-green-700"
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          {...register('notes')}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover disabled:opacity-50"
      >
        {isPending ? 'Saving...' : 'Save Inspection'}
      </button>
    </form>
  )
}
