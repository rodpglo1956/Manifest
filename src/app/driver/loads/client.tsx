'use client'

import type { Load, Vehicle } from '@/types/database'
import { useRealtimeLoads } from '@/hooks/use-realtime-loads'
import { DriverActiveLoad } from '@/components/drivers/driver-active-load'
import { DriverLoadHistory } from '@/components/drivers/driver-load-history'
import { Package } from 'lucide-react'

interface DriverLoadsClientProps {
  orgId: string
  activeLoad: (Load & { vehicle?: Vehicle | null }) | null
  historyLoads: Load[]
}

/**
 * Client wrapper for driver loads page.
 * Subscribes to Realtime for live load updates.
 */
export function DriverLoadsClient({ orgId, activeLoad, historyLoads }: DriverLoadsClientProps) {
  useRealtimeLoads(orgId)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">My Loads</h1>

      {/* Active load */}
      {activeLoad ? (
        <DriverActiveLoad load={activeLoad} orgId={orgId} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-medium text-gray-700">No Active Load</h2>
          <p className="text-sm text-gray-500 mt-1">
            You have no load currently assigned. Check back soon.
          </p>
        </div>
      )}

      {/* Load history */}
      {historyLoads.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Recent History
          </h2>
          <DriverLoadHistory loads={historyLoads} />
        </div>
      )}
    </div>
  )
}
