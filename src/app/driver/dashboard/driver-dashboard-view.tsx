'use client'

import { useRealtimeLoads } from '@/hooks/use-realtime-loads'
import { DriverActiveLoad } from '@/components/drivers/driver-active-load'
import type { Load, Vehicle, Dispatch } from '@/types/database'
import { Calendar, MapPin, Package, Clock } from 'lucide-react'

interface DriverDashboardViewProps {
  currentLoad: (Load & { vehicle?: Vehicle | null }) | null
  nextLoad: {
    load_number: string | null
    pickup_company: string | null
    pickup_date: string | null
    id: string
  } | null
  driverId: string
  orgId: string
}

export function DriverDashboardView({
  currentLoad,
  nextLoad,
  driverId,
  orgId,
}: DriverDashboardViewProps) {
  // Subscribe to realtime load updates
  useRealtimeLoads(orgId)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>

      {/* Current Load Card */}
      {currentLoad ? (
        <DriverActiveLoad load={currentLoad} orgId={orgId} />
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-900 text-white px-5 py-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Active Load</p>
            <p className="text-lg font-semibold mt-1">No Active Load</p>
          </div>
          <div className="p-5 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              You don&apos;t have an active load right now.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Check back when a new load is assigned to you.
            </p>
          </div>
        </div>
      )}

      {/* Next Upcoming Load */}
      {nextLoad && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Next Load
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-base font-mono font-semibold text-gray-900">
                {nextLoad.load_number ?? nextLoad.id.slice(0, 8)}
              </span>
            </div>
            {nextLoad.pickup_company && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{nextLoad.pickup_company}</span>
              </div>
            )}
            {nextLoad.pickup_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {new Date(nextLoad.pickup_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compliance Placeholder */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Compliance
        </h2>
        <div className="flex items-center gap-3 text-gray-400">
          <Clock className="w-5 h-5" />
          <p className="text-sm">
            Days until next compliance item expires -- Coming in Phase 7
          </p>
        </div>
      </div>
    </div>
  )
}
