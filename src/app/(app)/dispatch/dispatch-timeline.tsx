'use client'

import type { Driver } from '@/types/database'
import type { ActiveDispatch } from '@/components/dispatch/active-dispatches-list'

interface DispatchTimelineProps {
  drivers: Driver[]
  activeDispatches: ActiveDispatch[]
  onSelectDriver?: (driverId: string) => void
}

export default function DispatchTimeline({ drivers, activeDispatches, onSelectDriver }: DispatchTimelineProps) {
  return (
    <div className="p-4 text-gray-500 text-sm">
      Timeline view loading...
    </div>
  )
}
