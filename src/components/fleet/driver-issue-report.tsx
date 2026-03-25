'use client'

import { useTransition, useState, useRef, useEffect } from 'react'
import { createMaintenanceRecord } from '@/lib/fleet/actions'
import { createClient } from '@/lib/supabase/client'

interface DriverIssueReportProps {
  vehicleId: string
  unitNumber: string
  currentOdometer: number | null
  orgId: string
  onClose: () => void
}

const ISSUE_TYPES = [
  { value: 'tire_replacement', label: 'Tire Issue' },
  { value: 'brake_service', label: 'Brake Issue' },
  { value: 'engine', label: 'Engine Issue' },
  { value: 'electrical', label: 'Electrical Issue' },
  { value: 'hvac', label: 'HVAC Issue' },
  { value: 'other', label: 'Other' },
] as const

export function DriverIssueReport({
  vehicleId,
  unitNumber,
  currentOdometer,
  orgId,
  onClose,
}: DriverIssueReportProps) {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [severity, setSeverity] = useState<'can_drive' | 'must_stop'>('can_drive')
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [success, onClose])

  function handleSubmit(formData: FormData) {
    setErrors([])

    const description = formData.get('description') as string
    if (!description?.trim()) {
      setErrors(['Please describe the issue'])
      return
    }

    startTransition(async () => {
      // Create maintenance record
      const maintenanceData = new FormData()
      maintenanceData.set('vehicle_id', vehicleId)
      maintenanceData.set('maintenance_type', formData.get('maintenance_type') as string)
      maintenanceData.set('description', description)
      maintenanceData.set('odometer_at_service', String(currentOdometer ?? 0))
      maintenanceData.set('date_in', new Date().toISOString().split('T')[0])
      maintenanceData.set('cost_parts', '0')
      maintenanceData.set('cost_labor', '0')
      maintenanceData.set('cost_total', '0')
      maintenanceData.set('warranty_covered', 'false')

      const result = await createMaintenanceRecord(maintenanceData)
      if (result.error) {
        setErrors(result.error.form)
        return
      }

      // Create proactive alert for dispatcher visibility
      const alertSeverity = severity === 'must_stop' ? 'critical' : 'warning'
      const supabase = createClient()
      await supabase.from('proactive_alerts').insert({
        org_id: orgId,
        alert_type: 'maintenance_due',
        severity: alertSeverity,
        title: `Driver reported issue on ${unitNumber}`,
        message: description,
        related_entity_type: 'vehicle',
        related_entity_id: vehicleId,
        acknowledged: false,
      })

      setSuccess(true)
      formRef.current?.reset()
      setSeverity('can_drive')
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
      <h3 className="text-base font-semibold text-red-900">Report Issue</h3>

      {errors.length > 0 && (
        <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
          {errors.map((e, i) => (
            <p key={i} className="text-sm text-red-700">{e}</p>
          ))}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">Issue reported. Your dispatcher has been notified.</p>
        </div>
      )}

      <div>
        <label htmlFor="maintenance_type" className="block text-sm font-medium text-gray-700 mb-1">
          Issue Type *
        </label>
        <select
          id="maintenance_type"
          name="maintenance_type"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-red-500 focus:border-red-500"
          defaultValue="other"
        >
          {ISSUE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Describe the Issue *
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-red-500 focus:border-red-500"
          placeholder="Describe what's happening..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Severity
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSeverity('can_drive')}
            className={`py-3 rounded-lg text-sm font-medium border min-h-[44px] ${
              severity === 'can_drive'
                ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                : 'bg-white border-gray-300 text-gray-600'
            }`}
          >
            Can Still Drive
          </button>
          <button
            type="button"
            onClick={() => setSeverity('must_stop')}
            className={`py-3 rounded-lg text-sm font-medium border min-h-[44px] ${
              severity === 'must_stop'
                ? 'bg-red-100 border-red-400 text-red-800'
                : 'bg-white border-gray-300 text-gray-600'
            }`}
          >
            Need to Stop
          </button>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium text-base hover:bg-red-700 disabled:opacity-50 min-h-[44px]"
        >
          {isPending ? 'Submitting...' : 'Report Issue'}
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
