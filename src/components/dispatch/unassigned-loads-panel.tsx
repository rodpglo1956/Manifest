import Link from 'next/link'
import { MapPin, Calendar, Truck } from 'lucide-react'
import type { Load } from '@/types/database'

interface UnassignedLoadsPanelProps {
  loads: Load[]
  onSelectLoad: (loadId: string) => void
  selectedLoadId: string | null
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'TBD'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function UnassignedLoadsPanel({ loads, onSelectLoad, selectedLoadId }: UnassignedLoadsPanelProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Unassigned Loads</h2>
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
          {loads.length}
        </span>
      </div>

      <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
        {loads.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-gray-500 mb-2">All loads are dispatched</p>
            <Link
              href="/loads/new"
              className="text-sm text-primary hover:text-primary-hover font-medium"
            >
              Create New Load
            </Link>
          </div>
        ) : (
          loads.map((load) => (
            <div
              key={load.id}
              className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                selectedLoadId === load.id ? 'bg-primary-light ring-1 ring-primary' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {load.load_number || 'No Number'}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">
                      {load.pickup_city}, {load.pickup_state}
                    </span>
                    <span className="text-gray-400 mx-0.5">&rarr;</span>
                    <span className="truncate">
                      {load.delivery_city}, {load.delivery_state}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(load.pickup_date)}
                    </span>
                    {load.equipment_type && (
                      <span className="flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        {load.equipment_type.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectLoad(load.id)}
                  className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    selectedLoadId === load.id
                      ? 'bg-primary text-white'
                      : 'bg-primary-light text-primary hover:bg-primary hover:text-white'
                  }`}
                >
                  Dispatch
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
