'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { createMaintenanceRecord } from '@/lib/fleet/actions'
import { MAINTENANCE_TYPE_LABELS, formatCurrency } from '@/lib/fleet/fleet-helpers'
import type { MaintenanceRecord, MaintenanceType } from '@/types/database'

type UpcomingItem = {
  id: string
  title: string
  due_date: string | null
  status: string
  vehicle_id: string | null
  vehicles?: { unit_number: string } | null
}

type VehicleOption = {
  id: string
  unit_number: string
}

interface MaintenanceCenterProps {
  records: MaintenanceRecord[]
  upcomingItems: UpcomingItem[]
  vehicles: VehicleOption[]
}

const MAINTENANCE_TYPES = Object.keys(MAINTENANCE_TYPE_LABELS) as MaintenanceType[]

export function MaintenanceCenter({
  records,
  upcomingItems,
  vehicles,
}: MaintenanceCenterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const showForm = searchParams.get('addItem') === 'true'

  const [vehicleFilter, setVehicleFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isPending, startTransition] = useTransition()

  // Build vehicle lookup
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v.unit_number]))

  // Filter records
  const filteredRecords = records.filter((r) => {
    if (vehicleFilter && r.vehicle_id !== vehicleFilter) return false
    if (typeFilter && r.maintenance_type !== typeFilter) return false
    if (statusFilter === 'completed' && !r.date_out) return false
    if (statusFilter === 'in_progress' && r.date_out) return false
    return true
  })

  // Combine with upcoming/overdue items for status view
  const overdueItems = upcomingItems.filter((i) => i.status === 'overdue')

  function toggleForm() {
    const params = new URLSearchParams(searchParams.toString())
    if (showForm) {
      params.delete('addItem')
    } else {
      params.set('addItem', 'true')
    }
    router.push(`/fleet/maintenance?${params.toString()}`, { scroll: false })
  }

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createMaintenanceRecord(formData)
      if (!result.error) {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('addItem')
        router.push(`/fleet/maintenance?${params.toString()}`, { scroll: false })
        router.refresh()
      }
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Maintenance Center</h1>
          <p className="text-gray-500 mt-1">
            {records.length} record{records.length !== 1 ? 's' : ''}
            {overdueItems.length > 0 && (
              <span className="ml-2 text-red-600 font-medium">
                ({overdueItems.length} overdue)
              </span>
            )}
          </p>
        </div>
        <button
          onClick={toggleForm}
          className="flex items-center gap-2 py-2 px-4 bg-primary text-white font-medium rounded-md hover:bg-primary-hover transition-colors"
        >
          {showForm ? (
            <>
              <ChevronUp className="w-4 h-4" /> Hide Form
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Log Maintenance
            </>
          )}
        </button>
      </div>

      {/* Inline Add Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Log Maintenance Record
          </h2>
          <form action={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle *
              </label>
              <select
                name="vehicle_id"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">Select vehicle...</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.unit_number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                name="maintenance_type"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">Select type...</option>
                {MAINTENANCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {MAINTENANCE_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <input
                type="text"
                name="description"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Description of work performed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor Name
              </label>
              <input
                type="text"
                name="vendor_name"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor Location
              </label>
              <input
                type="text"
                name="vendor_location"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date In *
              </label>
              <input
                type="date"
                name="date_in"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Out
              </label>
              <input
                type="date"
                name="date_out"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Odometer at Service
              </label>
              <input
                type="number"
                name="odometer_at_service"
                min="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parts Cost
              </label>
              <input
                type="number"
                name="cost_parts"
                min="0"
                step="0.01"
                defaultValue="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Labor Cost
              </label>
              <input
                type="number"
                name="cost_labor"
                min="0"
                step="0.01"
                defaultValue="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Cost
              </label>
              <input
                type="number"
                name="cost_total"
                min="0"
                step="0.01"
                defaultValue="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="warranty_covered"
                value="true"
                id="warranty_covered"
                className="rounded border-gray-300"
              />
              <label htmlFor="warranty_covered" className="text-sm text-gray-700">
                Warranty Covered
              </label>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={toggleForm}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 text-sm bg-primary text-white font-medium rounded-md hover:bg-primary-hover disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Save Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.unit_number}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            {MAINTENANCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {MAINTENANCE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Maintenance Records Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium text-right">Cost</th>
                <th className="px-4 py-3 font-medium">Date In</th>
                <th className="px-4 py-3 font-medium">Date Out</th>
                <th className="px-4 py-3 font-medium text-right">Downtime</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    No maintenance records found
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const isOverdue =
                    !record.date_out &&
                    new Date(record.date_in) <
                      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {vehicleMap.get(record.vehicle_id) ?? 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {MAINTENANCE_TYPE_LABELS[record.maintenance_type] ??
                          record.maintenance_type}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {record.vendor_name ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {formatCurrency(record.cost_total)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(record.date_in).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {record.date_out
                          ? new Date(record.date_out).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {record.downtime_days != null
                          ? `${record.downtime_days}d`
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            record.date_out
                              ? 'bg-green-100 text-green-700'
                              : isOverdue
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {record.date_out
                            ? 'Completed'
                            : isOverdue
                            ? 'Overdue'
                            : 'In Progress'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
