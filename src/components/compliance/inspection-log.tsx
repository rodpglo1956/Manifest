'use client'

import { useState, useMemo } from 'react'
import { StatusBadge } from '@/components/ui/status-badge'
import type { Inspection, Vehicle } from '@/types/database'

interface InspectionLogProps {
  inspections: Inspection[]
  vehicles: Vehicle[]
}

const INSPECTION_TYPE_LABELS: Record<string, string> = {
  annual_dot: 'Annual DOT',
  pre_trip: 'Pre-Trip',
  post_trip: 'Post-Trip',
  roadside: 'Roadside',
  state: 'State',
  customer_required: 'Customer Required',
  internal: 'Internal',
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr + 'T00:00:00').getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function InspectionLog({ inspections, vehicles }: InspectionLogProps) {
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [resultFilter, setResultFilter] = useState('')

  const vehicleMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const v of vehicles) {
      map.set(v.id, v.unit_number)
    }
    return map
  }, [vehicles])

  const filtered = useMemo(() => {
    let list = inspections
    if (vehicleFilter) list = list.filter((i) => i.vehicle_id === vehicleFilter)
    if (typeFilter) list = list.filter((i) => i.inspection_type === typeFilter)
    if (resultFilter) list = list.filter((i) => i.result === resultFilter)
    return list
  }, [inspections, vehicleFilter, typeFilter, resultFilter])

  // Vehicle summary: last inspection + expiry per vehicle
  const vehicleSummary = useMemo(() => {
    const summary = new Map<string, { lastInspection: string; expiryDays: number | null }>()
    for (const insp of inspections) {
      const existing = summary.get(insp.vehicle_id)
      if (!existing || insp.inspection_date > existing.lastInspection) {
        summary.set(insp.vehicle_id, {
          lastInspection: insp.inspection_date,
          expiryDays: daysUntil(insp.expiry_date),
        })
      }
    }
    return summary
  }, [inspections])

  if (inspections.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No inspections recorded</p>
        <p className="mt-1 text-sm">Use the form above to log your first inspection.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Vehicle summary row */}
      {vehicles.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          {vehicles.map((v) => {
            const vs = vehicleSummary.get(v.id)
            if (!vs) return null
            const expiryColor = vs.expiryDays === null ? 'text-gray-400' : vs.expiryDays < 0 ? 'text-red-600' : vs.expiryDays <= 30 ? 'text-yellow-600' : 'text-green-600'
            return (
              <div key={v.id} className="px-3 py-2 border border-gray-200 rounded-md text-xs">
                <span className="font-medium">{v.unit_number}</span>
                <span className="text-gray-500 ml-2">Last: {vs.lastInspection}</span>
                {vs.expiryDays !== null && (
                  <span className={`ml-2 ${expiryColor}`}>
                    {vs.expiryDays < 0 ? `${Math.abs(vs.expiryDays)}d overdue` : `${vs.expiryDays}d until expiry`}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={vehicleFilter}
          onChange={(e) => setVehicleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">All Vehicles</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.unit_number}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">All Types</option>
          {Object.entries(INSPECTION_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">All Results</option>
          <option value="pass">Pass</option>
          <option value="fail">Fail</option>
          <option value="conditional">Conditional</option>
        </select>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inspector</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Defects</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map((insp) => (
              <tr key={insp.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{insp.inspection_date}</td>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                  {vehicleMap.get(insp.vehicle_id) ?? insp.vehicle_id.slice(0, 8)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {INSPECTION_TYPE_LABELS[insp.inspection_type] ?? insp.inspection_type}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{insp.inspector_name ?? '-'}</td>
                <td className="px-4 py-3">
                  {insp.result ? (
                    <StatusBadge status={insp.result} variant="inspection" />
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {insp.defects_found && insp.defects_found.length > 0 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                      {insp.defects_found.length}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">0</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {insp.expiry_date ?? '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
