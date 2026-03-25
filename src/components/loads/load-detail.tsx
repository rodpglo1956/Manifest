'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadDocuments } from '@/components/loads/load-documents'
import { LoadTimeline } from '@/components/loads/load-timeline'
import { VALID_TRANSITIONS, getStatusLabel } from '@/lib/load-status'
import { updateLoadStatus } from '@/app/(app)/loads/status-actions'
import type { Load, LoadStatus, LoadStatusHistory, Driver, Vehicle } from '@/types/database'
import { Pencil, ArrowRight } from 'lucide-react'

interface LoadDetailProps {
  load: Load & {
    driver?: Pick<Driver, 'id' | 'first_name' | 'last_name'> | null
    vehicle?: Pick<Vehicle, 'id' | 'unit_number' | 'make' | 'model'> | null
  }
  statusHistory: (LoadStatusHistory & {
    changed_by_name?: string | null
  })[]
  orgId: string
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return '--'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDate(date: string | null): string {
  if (!date) return '--'
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 mt-0.5">{value ?? '--'}</dd>
    </div>
  )
}

export function LoadDetail({ load, statusHistory, orgId }: LoadDetailProps) {
  const router = useRouter()
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validTransitions = VALID_TRANSITIONS[load.status] ?? []

  async function handleStatusUpdate(newStatus: LoadStatus) {
    setUpdating(true)
    setError(null)
    const result = await updateLoadStatus(load.id, newStatus)
    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
    }
    setUpdating(false)
  }

  const equipmentLabel = load.equipment_type
    ? load.equipment_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : '--'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono">{load.load_number ?? 'Draft'}</h1>
            <StatusBadge status={load.status} variant="load" />
          </div>

          {/* Status transition buttons */}
          {validTransitions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {validTransitions.map((nextStatus) => (
                <button
                  key={nextStatus}
                  type="button"
                  onClick={() => handleStatusUpdate(nextStatus)}
                  disabled={updating}
                  className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md border transition-colors disabled:opacity-50 ${
                    nextStatus === 'canceled'
                      ? 'border-red-200 text-red-600 hover:bg-red-50'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ArrowRight className="w-3 h-3" />
                  {getStatusLabel(nextStatus)}
                </button>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <Link
          href={`/loads/${load.id}/edit`}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          <Pencil className="w-4 h-4" />
          Edit
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pickup */}
        <Section title="Pickup">
          <dl className="grid grid-cols-2 gap-3">
            <Field label="Company" value={load.pickup_city} />
            <Field label="Date" value={formatDate(load.pickup_date)} />
            <div className="col-span-2">
              <Field
                label="Address"
                value={
                  [load.pickup_address, load.pickup_city, load.pickup_state, load.pickup_zip]
                    .filter(Boolean)
                    .join(', ') || '--'
                }
              />
            </div>
            <Field label="Time Window" value={load.pickup_time ?? '--'} />
            <Field label="Reference" value={load.pickup_notes ?? '--'} />
            <Field label="Contact" value={load.pickup_contact_name ?? '--'} />
            <Field label="Phone" value={load.pickup_contact_phone ?? '--'} />
          </dl>
        </Section>

        {/* Delivery */}
        <Section title="Delivery">
          <dl className="grid grid-cols-2 gap-3">
            <Field label="Company" value={load.delivery_city} />
            <Field label="Date" value={formatDate(load.delivery_date)} />
            <div className="col-span-2">
              <Field
                label="Address"
                value={
                  [load.delivery_address, load.delivery_city, load.delivery_state, load.delivery_zip]
                    .filter(Boolean)
                    .join(', ') || '--'
                }
              />
            </div>
            <Field label="Time Window" value={load.delivery_time ?? '--'} />
            <Field label="Reference" value={load.delivery_notes ?? '--'} />
            <Field label="Contact" value={load.delivery_contact_name ?? '--'} />
            <Field label="Phone" value={load.delivery_contact_phone ?? '--'} />
          </dl>
        </Section>

        {/* Freight */}
        <Section title="Freight">
          <dl className="grid grid-cols-2 gap-3">
            <Field label="Commodity" value={load.commodity ?? '--'} />
            <Field
              label="Weight"
              value={
                load.weight
                  ? `${load.weight.toLocaleString()} ${load.weight_unit ?? 'lbs'}`
                  : '--'
              }
            />
            <Field label="Pieces" value={load.pieces?.toLocaleString() ?? '--'} />
            <Field label="Equipment" value={equipmentLabel} />
            {load.equipment_type === 'reefer' && (
              <>
                <Field
                  label="Temp Range"
                  value={
                    load.temperature_min !== null && load.temperature_max !== null
                      ? `${load.temperature_min}F - ${load.temperature_max}F`
                      : '--'
                  }
                />
              </>
            )}
            <Field
              label="Hazmat"
              value={
                load.hazmat ? (
                  <span className="text-red-600 font-medium">Yes</span>
                ) : (
                  'No'
                )
              }
            />
          </dl>
        </Section>

        {/* Rate Breakdown */}
        <Section title="Rate Breakdown">
          <dl className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Rate ({load.rate_type ?? 'flat'})
              </span>
              <span>{formatCurrency(load.rate_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Est. Miles</span>
              <span>{load.miles?.toLocaleString() ?? '--'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Fuel Surcharge</span>
              <span>{formatCurrency(load.fuel_surcharge)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Accessorials</span>
              <span>{formatCurrency(load.accessorial_charges)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2">
              <span>Total Revenue</span>
              <span className="text-primary">{formatCurrency(load.total_charges)}</span>
            </div>
          </dl>
        </Section>

        {/* Broker / Source */}
        <Section title="Broker / Source">
          <dl className="grid grid-cols-2 gap-3">
            <Field label="Name" value={load.broker_name ?? '--'} />
            <Field
              label="MC#"
              value={
                load.broker_mc_number ? (
                  <span className="font-mono">{load.broker_mc_number}</span>
                ) : (
                  '--'
                )
              }
            />
            <Field label="Contact" value={load.broker_contact ?? '--'} />
            <Field label="Phone" value={load.broker_phone ?? '--'} />
            <Field label="Email" value={load.broker_email ?? '--'} />
            <Field label="Reference" value={load.broker_reference ?? '--'} />
          </dl>
        </Section>

        {/* Assignment */}
        <Section title="Assignment">
          <dl className="grid grid-cols-2 gap-3">
            <Field
              label="Driver"
              value={
                load.driver ? (
                  <Link
                    href={`/drivers/${load.driver.id}`}
                    className="text-primary hover:underline"
                  >
                    {load.driver.first_name} {load.driver.last_name}
                  </Link>
                ) : (
                  <span className="text-gray-400">Unassigned</span>
                )
              }
            />
            <Field
              label="Vehicle"
              value={
                load.vehicle ? (
                  <span>
                    {load.vehicle.unit_number}{' '}
                    <span className="text-gray-500">
                      {[load.vehicle.make, load.vehicle.model].filter(Boolean).join(' ')}
                    </span>
                  </span>
                ) : (
                  <span className="text-gray-400">Unassigned</span>
                )
              }
            />
          </dl>
        </Section>
      </div>

      {/* Documents */}
      <Section title="Documents">
        <LoadDocuments
          loadId={load.id}
          orgId={orgId}
          bolUrl={load.bol_url}
          rateConfirmationUrl={load.rate_confirmation_url}
          podUrl={load.pod_url}
        />
      </Section>

      {/* Status Timeline */}
      <Section title="Status Timeline">
        <LoadTimeline statusHistory={statusHistory} />
      </Section>

      {/* Notes */}
      {load.notes && (
        <Section title="Notes">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{load.notes}</p>
        </Section>
      )}
    </div>
  )
}
