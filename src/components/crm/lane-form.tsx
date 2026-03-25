'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { laneSchema, type LaneInput } from '@/lib/crm/schemas'
import { createLane, updateLane } from '@/app/(app)/crm/actions'
import type { CrmLane } from '@/types/database'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
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

interface LaneFormProps {
  lane?: CrmLane
  onSuccess?: () => void
  onCancel?: () => void
}

export function LaneForm({ lane, onSuccess, onCancel }: LaneFormProps) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!lane

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LaneInput>({
    resolver: zodResolver(laneSchema),
    defaultValues: lane
      ? {
          origin_city: lane.origin_city,
          origin_state: lane.origin_state,
          origin_zip: lane.origin_zip ?? '',
          destination_city: lane.destination_city,
          destination_state: lane.destination_state,
          destination_zip: lane.destination_zip ?? '',
          distance_miles: lane.distance_miles ?? undefined,
          preferred_equipment: lane.preferred_equipment ?? [],
          notes: lane.notes ?? '',
          status: lane.status,
        }
      : {
          status: 'active',
          preferred_equipment: [],
        },
  })

  function onSubmit(data: LaneInput) {
    startTransition(async () => {
      const result = isEdit
        ? await updateLane(lane!.id, data)
        : await createLane(data)

      if (result.error) {
        const msgs = 'form' in result.error ? result.error.form : [String(result.error)]
        setError('root', { message: msgs.join(', ') })
        return
      }

      onSuccess?.()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {errors.root && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {errors.root.message}
        </div>
      )}

      {/* Origin */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Origin</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
            <input
              {...register('origin_city')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            {errors.origin_city && <p className="text-xs text-red-500 mt-1">{errors.origin_city.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
            <select
              {...register('origin_state')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Select...</option>
              {US_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            {errors.origin_state && <p className="text-xs text-red-500 mt-1">{errors.origin_state.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
            <input
              {...register('origin_zip')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Destination */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Destination</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
            <input
              {...register('destination_city')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            {errors.destination_city && <p className="text-xs text-red-500 mt-1">{errors.destination_city.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
            <select
              {...register('destination_state')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Select...</option>
              {US_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            {errors.destination_state && <p className="text-xs text-red-500 mt-1">{errors.destination_state.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
            <input
              {...register('destination_zip')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Distance, Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Distance (miles)</label>
          <input
            type="number"
            {...register('distance_miles')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            {...register('status')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="seasonal">Seasonal</option>
          </select>
        </div>
      </div>

      {/* Equipment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Equipment</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {EQUIPMENT_TYPES.map((eq) => (
            <label key={eq} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                value={eq}
                {...register('preferred_equipment')}
                className="rounded border-gray-300 text-primary focus:ring-primary/20"
              />
              {formatEquipmentLabel(eq)}
            </label>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

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
          {isPending ? 'Saving...' : isEdit ? 'Update Lane' : 'Create Lane'}
        </button>
      </div>
    </form>
  )
}
