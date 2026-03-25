import { Clock } from 'lucide-react'
import { StatusBadge } from '@/components/ui/status-badge'
import type { DispatchStatus } from '@/types/database'

export type ActiveDispatch = {
  id: string
  status: DispatchStatus
  estimated_pickup_arrival: string | null
  estimated_delivery_arrival: string | null
  load_number: string | null
  pickup_city: string | null
  pickup_state: string | null
  delivery_city: string | null
  delivery_state: string | null
  pickup_date: string | null
  equipment_type: string | null
  driver_first_name: string
  driver_last_name: string
}

interface ActiveDispatchesListProps {
  dispatches: ActiveDispatch[]
}

function formatEta(dateStr: string | null): { label: string; overdue: boolean } {
  if (!dateStr) return { label: '--', overdue: false }
  const eta = new Date(dateStr)
  const now = new Date()
  const overdue = eta < now
  const label = eta.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return { label: `ETA: ${label}`, overdue }
}

function getActiveEta(dispatch: ActiveDispatch): { label: string; overdue: boolean } {
  // Show delivery ETA if past pickup stages, otherwise show pickup ETA
  const pastPickup = ['en_route_delivery', 'at_delivery'].includes(dispatch.status)
  if (pastPickup && dispatch.estimated_delivery_arrival) {
    return formatEta(dispatch.estimated_delivery_arrival)
  }
  if (dispatch.estimated_pickup_arrival) {
    return formatEta(dispatch.estimated_pickup_arrival)
  }
  if (dispatch.estimated_delivery_arrival) {
    return formatEta(dispatch.estimated_delivery_arrival)
  }
  return { label: '--', overdue: false }
}

export function ActiveDispatchesList({ dispatches }: ActiveDispatchesListProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Active Dispatches</h2>
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
          {dispatches.length}
        </span>
      </div>

      {dispatches.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-gray-500">No active dispatches</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Load</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Driver</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">ETA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dispatches.map((dispatch) => {
                const eta = getActiveEta(dispatch)
                return (
                  <tr key={dispatch.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-gray-900">
                      {dispatch.load_number || '--'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">
                      {dispatch.driver_first_name} {dispatch.driver_last_name}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {dispatch.pickup_city}, {dispatch.pickup_state}
                      <span className="text-gray-400 mx-1">&rarr;</span>
                      {dispatch.delivery_city}, {dispatch.delivery_state}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={dispatch.status} variant="dispatch" />
                    </td>
                    <td className="px-4 py-2.5">
                      {eta.label !== '--' ? (
                        <span className={`flex items-center gap-1 text-xs ${eta.overdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                          <Clock className="w-3 h-3" />
                          {eta.label}
                          {eta.overdue && <span className="text-red-600">(overdue)</span>}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">--</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
