'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { rateAgreementSchema, type RateAgreementInput } from '@/lib/crm/schemas'
import { createRateAgreement, updateRateAgreement } from '@/app/(app)/crm/actions'
import type { CrmRateAgreement, CrmCompany } from '@/types/database'

const RATE_TYPES = [
  { value: 'per_mile', label: 'Per Mile' },
  { value: 'flat_rate', label: 'Flat Rate' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'hourly', label: 'Hourly' },
]

const EQUIPMENT_TYPES = [
  'dry_van', 'reefer', 'flatbed', 'sprinter', 'box_truck',
  'medical_van', 'hotshot', 'straight_truck', 'day_cab', 'sleeper',
  'tanker', 'dry_van_trailer', 'flatbed_trailer', 'reefer_trailer',
  'step_deck_trailer', 'other',
]

function formatEquipmentLabel(val: string): string {
  return val.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

interface RateAgreementFormProps {
  agreement?: CrmRateAgreement
  companies: Pick<CrmCompany, 'id' | 'name'>[]
  laneId?: string
  companyId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function RateAgreementForm({
  agreement,
  companies,
  laneId,
  companyId,
  onSuccess,
  onCancel,
}: RateAgreementFormProps) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!agreement

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RateAgreementInput>({
    resolver: zodResolver(rateAgreementSchema),
    defaultValues: agreement
      ? {
          company_id: agreement.company_id,
          lane_id: agreement.lane_id ?? '',
          rate_type: agreement.rate_type,
          rate_amount: agreement.rate_amount,
          effective_date: agreement.effective_date,
          expiry_date: agreement.expiry_date ?? '',
          min_volume: agreement.min_volume ?? undefined,
          equipment_type: agreement.equipment_type ?? '',
          document_url: agreement.document_url ?? '',
          status: agreement.status,
        }
      : {
          company_id: companyId ?? '',
          lane_id: laneId ?? '',
          rate_type: 'per_mile',
          effective_date: new Date().toISOString().split('T')[0],
          status: 'pending',
        },
  })

  function onSubmit(data: RateAgreementInput) {
    startTransition(async () => {
      const result = isEdit
        ? await updateRateAgreement(agreement!.id, data)
        : await createRateAgreement(data)

      if (result.error) {
        const msgs = 'form' in result.error ? result.error.form : [String(result.error)]
        setError('root', { message: msgs.join(', ') })
        return
      }

      onSuccess?.()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errors.root && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {errors.root.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
          <select
            {...register('company_id')}
            disabled={!!companyId}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-100"
          >
            <option value="">Select company...</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.company_id && <p className="text-xs text-red-500 mt-1">{errors.company_id.message}</p>}
        </div>

        {/* Rate Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rate Type *</label>
          <select
            {...register('rate_type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {RATE_TYPES.map((rt) => (
              <option key={rt.value} value={rt.value}>{rt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Rate Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rate Amount *</label>
          <input
            type="number"
            step="0.01"
            {...register('rate_amount')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {errors.rate_amount && <p className="text-xs text-red-500 mt-1">{errors.rate_amount.message}</p>}
        </div>

        {/* Effective Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date *</label>
          <input
            type="date"
            {...register('effective_date')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {errors.effective_date && <p className="text-xs text-red-500 mt-1">{errors.effective_date.message}</p>}
        </div>

        {/* Expiry Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
          <input
            type="date"
            {...register('expiry_date')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Min Volume */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Volume</label>
          <input
            type="number"
            {...register('min_volume')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Equipment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Type</label>
          <select
            {...register('equipment_type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">Any</option>
            {EQUIPMENT_TYPES.map((eq) => (
              <option key={eq} value={eq}>{formatEquipmentLabel(eq)}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            {...register('status')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Document URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Document URL</label>
        <input
          {...register('document_url')}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Hidden lane_id */}
      {laneId && <input type="hidden" {...register('lane_id')} />}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Saving...' : isEdit ? 'Update Agreement' : 'Create Agreement'}
        </button>
      </div>
    </form>
  )
}
