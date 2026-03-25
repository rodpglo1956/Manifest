'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { driverQualificationSchema, type DriverQualificationInput } from '@/lib/compliance/compliance-schemas'
import { upsertDriverQualification } from '@/lib/compliance/actions'
import type { DriverQualification } from '@/types/database'

interface DQChecklistProps {
  driverId: string
  driverName: string
  dq: DriverQualification | null
  completeness: { percentage: number; missing: string[] }
}

type DQStatus = 'present' | 'missing' | 'expired' | 'stale'

interface ChecklistItem {
  key: string
  label: string
  dateField: keyof DriverQualification | null
  status: DQStatus
  date: string | null
}

const ENDORSEMENT_OPTIONS = ['H', 'N', 'P', 'S', 'T', 'X']

function getItemStatus(
  dq: DriverQualification | null,
  missing: string[],
  field: string,
  dateValue: string | null
): DQStatus {
  if (!dq || missing.includes(field)) {
    if (!dateValue) return 'missing'
    // Has a date but still in missing list = expired or stale
    return 'expired'
  }
  return 'present'
}

function StatusIcon({ status }: { status: DQStatus }) {
  switch (status) {
    case 'present':
      return <span className="w-5 h-5 flex items-center justify-center rounded-full bg-green-100 text-green-600 text-xs font-bold">&#10003;</span>
    case 'missing':
      return <span className="w-5 h-5 flex items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-bold">&#10007;</span>
    case 'expired':
      return <span className="w-5 h-5 flex items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-bold">!</span>
    case 'stale':
      return <span className="w-5 h-5 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600 text-xs font-bold">!</span>
  }
}

function statusLabel(status: DQStatus): string {
  switch (status) {
    case 'present': return 'Present'
    case 'missing': return 'Missing'
    case 'expired': return 'Expired'
    case 'stale': return 'Stale'
  }
}

function CompletenessCircle({ percentage }: { percentage: number }) {
  const color =
    percentage >= 80 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="flex items-center gap-3">
      <div className={`text-3xl font-bold ${color}`}>{percentage}%</div>
      <div className="text-sm text-gray-500">DQ File Complete</div>
    </div>
  )
}

export function DQChecklist({ driverId, driverName, dq, completeness }: DQChecklistProps) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<DriverQualificationInput>({
    resolver: zodResolver(driverQualificationSchema),
    defaultValues: {
      cdl_number: dq?.cdl_number ?? '',
      cdl_state: dq?.cdl_state ?? '',
      cdl_class: dq?.cdl_class ?? 'none',
      cdl_expiry: dq?.cdl_expiry ?? '',
      medical_card_expiry: dq?.medical_card_expiry ?? '',
      endorsements: dq?.endorsements ?? [],
      mvr_last_pulled: dq?.mvr_last_pulled ?? '',
      mvr_status: dq?.mvr_status ?? '',
      drug_test_last_date: dq?.drug_test_last_date ?? '',
      drug_test_result: dq?.drug_test_result ?? '',
      annual_review_date: dq?.annual_review_date ?? '',
      road_test_date: dq?.road_test_date ?? '',
      application_date: dq?.application_date ?? '',
      hire_date: dq?.hire_date ?? '',
    },
  })

  const endorsements = watch('endorsements') ?? []

  const items: ChecklistItem[] = [
    {
      key: 'application_date',
      label: 'Employment Application',
      dateField: 'application_date',
      status: getItemStatus(dq, completeness.missing, 'application_date', dq?.application_date ?? null),
      date: dq?.application_date ?? null,
    },
    {
      key: 'cdl_number',
      label: 'CDL Copy',
      dateField: null,
      status: getItemStatus(dq, completeness.missing, 'cdl_number', dq?.cdl_number ?? null),
      date: dq?.cdl_expiry ?? null,
    },
    {
      key: 'medical_card_expiry',
      label: 'Medical Certificate',
      dateField: 'medical_card_expiry',
      status: getItemStatus(dq, completeness.missing, 'medical_card_expiry', dq?.medical_card_expiry ?? null),
      date: dq?.medical_card_expiry ?? null,
    },
    {
      key: 'mvr_last_pulled',
      label: 'Motor Vehicle Record (MVR)',
      dateField: 'mvr_last_pulled',
      status: getItemStatus(dq, completeness.missing, 'mvr_last_pulled', dq?.mvr_last_pulled ?? null),
      date: dq?.mvr_last_pulled ?? null,
    },
    {
      key: 'road_test_date',
      label: 'Road Test Certificate',
      dateField: 'road_test_date',
      status: getItemStatus(dq, completeness.missing, 'road_test_date', dq?.road_test_date ?? null),
      date: dq?.road_test_date ?? null,
    },
    {
      key: 'annual_review_date',
      label: 'Annual Driving Record Review',
      dateField: 'annual_review_date',
      status: getItemStatus(dq, completeness.missing, 'annual_review_date', dq?.annual_review_date ?? null),
      date: dq?.annual_review_date ?? null,
    },
    {
      key: 'drug_test_last_date',
      label: 'Drug Test Result',
      dateField: 'drug_test_last_date',
      status: getItemStatus(dq, completeness.missing, 'drug_test_last_date', dq?.drug_test_last_date ?? null),
      date: dq?.drug_test_last_date ?? null,
    },
    {
      key: 'hire_date',
      label: 'Employment Verification',
      dateField: 'hire_date',
      status: getItemStatus(dq, completeness.missing, 'hire_date', dq?.hire_date ?? null),
      date: dq?.hire_date ?? null,
    },
  ]

  const onSubmit = (data: DriverQualificationInput) => {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await upsertDriverQualification(driverId, data)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setEditing(false)
      }
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{driverName}</h2>
          <p className="text-sm text-gray-500">FMCSA Part 391 Driver Qualification File</p>
        </div>
        <CompletenessCircle percentage={completeness.percentage} />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-md">
          DQ file updated successfully.
        </div>
      )}

      {/* Checklist */}
      <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 mb-6">
        {items.map((item) => (
          <div
            key={item.key}
            className={`flex items-center justify-between px-4 py-3 ${
              item.status === 'missing' ? 'bg-red-50/50' : item.status === 'expired' || item.status === 'stale' ? 'bg-yellow-50/50' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <StatusIcon status={item.status} />
              <div>
                <span className="text-sm font-medium text-gray-900">{item.label}</span>
                {item.date && (
                  <span className="ml-2 text-xs text-gray-500">{item.date}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium ${
                  item.status === 'present'
                    ? 'text-green-600'
                    : item.status === 'missing'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                }`}
              >
                {statusLabel(item.status)}
              </span>
              {item.status !== 'present' && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-primary hover:text-primary-hover font-medium"
                >
                  {item.status === 'missing' ? 'Add' : 'Update'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Form */}
      {!editing ? (
        <button
          onClick={() => setEditing(true)}
          className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Edit DQ File
        </button>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Edit Qualification Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">CDL Number</label>
              <input type="text" {...register('cdl_number')} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">CDL State</label>
              <input type="text" {...register('cdl_state')} maxLength={2} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">CDL Class</label>
              <select {...register('cdl_class')} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="none">None</option>
                <option value="A">Class A</option>
                <option value="B">Class B</option>
                <option value="C">Class C</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">CDL Expiry</label>
              <input type="date" {...register('cdl_expiry')} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Medical Card Expiry</label>
              <input type="date" {...register('medical_card_expiry')} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Endorsements</label>
              <div className="flex flex-wrap gap-2">
                {ENDORSEMENT_OPTIONS.map((e) => (
                  <label key={e} className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={endorsements?.includes(e) ?? false}
                      onChange={(ev) => {
                        const current = endorsements ?? []
                        if (ev.target.checked) {
                          setValue('endorsements', [...current, e])
                        } else {
                          setValue('endorsements', current.filter((x) => x !== e))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    {e}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">MVR Last Pulled</label>
              <input type="date" {...register('mvr_last_pulled')} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Drug Test Last Date</label>
              <input type="date" {...register('drug_test_last_date')} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Annual Review Date</label>
              <input type="date" {...register('annual_review_date')} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Road Test Date</label>
              <input type="date" {...register('road_test_date')} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Application Date</label>
              <input type="date" {...register('application_date')} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Hire Date</label>
              <input type="date" {...register('hire_date')} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
          </div>

          {Object.keys(errors).length > 0 && (
            <p className="text-sm text-red-600">Please fix the errors above.</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
