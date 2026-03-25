'use client'

import { useState } from 'react'
import { useRealtimeDispatches } from '@/hooks/use-realtime-dispatches'
import { useRealtimeLoads } from '@/hooks/use-realtime-loads'
import { UnassignedLoadsPanel } from '@/components/dispatch/unassigned-loads-panel'
import { AvailableDriversPanel } from '@/components/dispatch/available-drivers-panel'
import { DispatchAssignmentForm } from '@/components/dispatch/dispatch-assignment-form'
import { ActiveDispatchesList, type ActiveDispatch } from '@/components/dispatch/active-dispatches-list'
import type { Load, Driver, Vehicle } from '@/types/database'

interface DispatchBoardProps {
  unassignedLoads: Load[]
  drivers: Driver[]
  activeDispatches: ActiveDispatch[]
  busyDriverIds: string[]
  vehicles: Pick<Vehicle, 'id' | 'unit_number' | 'make' | 'model'>[]
  orgId: string | null
}

export function DispatchBoard({
  unassignedLoads,
  drivers,
  activeDispatches,
  busyDriverIds,
  vehicles,
  orgId,
}: DispatchBoardProps) {
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null)

  // Subscribe to realtime updates for both dispatches and loads
  useRealtimeDispatches(orgId)
  useRealtimeLoads(orgId)

  const selectedLoad = selectedLoadId
    ? unassignedLoads.find((l) => l.id === selectedLoadId) ?? null
    : null

  // Available drivers = active drivers not busy
  const busySet = new Set(busyDriverIds)
  const availableDrivers = drivers.filter((d) => !busySet.has(d.id))

  const handleSelectLoad = (loadId: string) => {
    setSelectedLoadId((prev) => (prev === loadId ? null : loadId))
  }

  const handleCloseForm = () => {
    setSelectedLoadId(null)
  }

  return (
    <div className="space-y-6">
      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <UnassignedLoadsPanel
            loads={unassignedLoads}
            onSelectLoad={handleSelectLoad}
            selectedLoadId={selectedLoadId}
          />

          {/* Assignment form appears below the loads panel when a load is selected */}
          {selectedLoad && (
            <DispatchAssignmentForm
              load={selectedLoad}
              drivers={availableDrivers}
              vehicles={vehicles}
              onClose={handleCloseForm}
            />
          )}
        </div>

        <AvailableDriversPanel
          drivers={drivers}
          busyDriverIds={busyDriverIds}
          vehicles={vehicles}
        />
      </div>

      {/* Active dispatches - full width */}
      <ActiveDispatchesList dispatches={activeDispatches} />
    </div>
  )
}
