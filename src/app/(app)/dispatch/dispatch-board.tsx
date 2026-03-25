'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Map as MapIcon, List, Clock } from 'lucide-react'
import { useRealtimeDispatches } from '@/hooks/use-realtime-dispatches'
import { useRealtimeLoads } from '@/hooks/use-realtime-loads'
import { UnassignedLoadsPanel } from '@/components/dispatch/unassigned-loads-panel'
import { AvailableDriversPanel } from '@/components/dispatch/available-drivers-panel'
import { DispatchAssignmentForm } from '@/components/dispatch/dispatch-assignment-form'
import { ActiveDispatchesList, type ActiveDispatch } from '@/components/dispatch/active-dispatches-list'
import type { Load, Driver, Vehicle } from '@/types/database'

const DispatchMap = dynamic(() => import('./dispatch-map'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] bg-gray-100 animate-pulse rounded-lg" />
  ),
})

const DispatchTimeline = dynamic(() => import('./dispatch-timeline'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-100 animate-pulse rounded-lg" />
  ),
})

type ViewTab = 'list' | 'map' | 'timeline'

interface DispatchBoardProps {
  unassignedLoads: Load[]
  drivers: Driver[]
  activeDispatches: ActiveDispatch[]
  busyDriverIds: string[]
  vehicles: Pick<Vehicle, 'id' | 'unit_number' | 'make' | 'model'>[]
  orgId: string | null
}

const VIEW_TABS: { id: ViewTab; label: string; icon: typeof List }[] = [
  { id: 'list', label: 'List', icon: List },
  { id: 'map', label: 'Map', icon: MapIcon },
  { id: 'timeline', label: 'Timeline', icon: Clock },
]

export function DispatchBoard({
  unassignedLoads,
  drivers,
  activeDispatches,
  busyDriverIds,
  vehicles,
  orgId,
}: DispatchBoardProps) {
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<ViewTab>('list')

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
      {/* Tab navigation */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {VIEW_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveView(id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeView === id
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* View content */}
      {activeView === 'list' && (
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
      )}

      {activeView === 'map' && (
        <div className="space-y-4">
          <DispatchMap
            loads={unassignedLoads}
            drivers={drivers}
            activeDispatches={activeDispatches}
            onSelectLoad={handleSelectLoad}
          />

          {/* Assignment form visible alongside map view */}
          {selectedLoad && (
            <DispatchAssignmentForm
              load={selectedLoad}
              drivers={availableDrivers}
              vehicles={vehicles}
              onClose={handleCloseForm}
            />
          )}
        </div>
      )}

      {activeView === 'timeline' && (
        <div className="space-y-4">
          <DispatchTimeline
            drivers={drivers}
            activeDispatches={activeDispatches}
          />

          {/* Assignment form visible alongside timeline view */}
          {selectedLoad && (
            <DispatchAssignmentForm
              load={selectedLoad}
              drivers={availableDrivers}
              vehicles={vehicles}
              onClose={handleCloseForm}
            />
          )}
        </div>
      )}

      {/* Active dispatches - full width (visible in all views) */}
      <ActiveDispatchesList dispatches={activeDispatches} />
    </div>
  )
}
