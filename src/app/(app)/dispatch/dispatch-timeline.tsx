'use client'

import { useMemo } from 'react'
import type { Driver, DispatchStatus } from '@/types/database'
import type { ActiveDispatch } from '@/components/dispatch/active-dispatches-list'

interface DispatchTimelineProps {
  drivers: Driver[]
  activeDispatches: ActiveDispatch[]
  onSelectDriver?: (driverId: string) => void
}

const STATUS_COLORS: Record<string, string> = {
  assigned: 'bg-yellow-400',
  accepted: 'bg-blue-400',
  en_route_pickup: 'bg-green-500',
  at_pickup: 'bg-orange-400',
  en_route_delivery: 'bg-green-500',
  at_delivery: 'bg-orange-400',
}

const STATUS_LABELS: Record<string, string> = {
  assigned: 'Assigned',
  accepted: 'Accepted',
  en_route_pickup: 'En Route (P)',
  at_pickup: 'At Pickup',
  en_route_delivery: 'En Route (D)',
  at_delivery: 'At Delivery',
}

function getDayLabels(days: number): { label: string; date: Date }[] {
  const result: { label: string; date: Date }[] = []
  const now = new Date()
  for (let i = 0; i < days; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    result.push({
      label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      date: d,
    })
  }
  return result
}

export default function DispatchTimeline({
  drivers,
  activeDispatches,
  onSelectDriver,
}: DispatchTimelineProps) {
  const TIMELINE_DAYS = 7
  const dayLabels = useMemo(() => getDayLabels(TIMELINE_DAYS), [])

  // Timeline range
  const now = new Date()
  const timelineStart = new Date(now)
  timelineStart.setHours(0, 0, 0, 0)
  const timelineEnd = new Date(timelineStart)
  timelineEnd.setDate(timelineEnd.getDate() + TIMELINE_DAYS)
  const totalMs = timelineEnd.getTime() - timelineStart.getTime()

  // Group dispatches by driver
  const dispatchesByDriver = useMemo(() => {
    const map = new globalThis.Map<string, ActiveDispatch[]>()
    for (const d of activeDispatches) {
      // Match dispatch to driver by name since ActiveDispatch uses first/last name
      const key = `${d.driver_first_name}|${d.driver_last_name}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(d)
    }
    return map
  }, [activeDispatches])

  // Compute bar position as percentage
  function getBarStyle(dispatch: ActiveDispatch): { left: string; width: string } | null {
    if (!dispatch.pickup_date) return null

    const pickupDate = new Date(dispatch.pickup_date)
    // Use delivery_date, then estimated_delivery_arrival, then pickup + 1 day
    let deliveryDate: Date
    if (dispatch.delivery_date) {
      deliveryDate = new Date(dispatch.delivery_date)
    } else if (dispatch.estimated_delivery_arrival) {
      deliveryDate = new Date(dispatch.estimated_delivery_arrival)
    } else {
      deliveryDate = new Date(pickupDate)
      deliveryDate.setDate(deliveryDate.getDate() + 1)
    }

    // Clamp to timeline bounds
    const barStart = Math.max(pickupDate.getTime(), timelineStart.getTime())
    const barEnd = Math.min(deliveryDate.getTime(), timelineEnd.getTime())

    if (barEnd <= timelineStart.getTime() || barStart >= timelineEnd.getTime()) {
      return null // Out of visible range
    }

    const leftPct = ((barStart - timelineStart.getTime()) / totalMs) * 100
    const widthPct = Math.max(((barEnd - barStart) / totalMs) * 100, 2) // min 2% for visibility

    return {
      left: `${leftPct}%`,
      width: `${widthPct}%`,
    }
  }

  // Current time marker position
  const nowPct = ((now.getTime() - timelineStart.getTime()) / totalMs) * 100

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Driver Schedule Timeline</h3>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {Object.entries(STATUS_COLORS).slice(0, 4).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1">
                <span className={`inline-block w-2.5 h-2.5 rounded-sm ${color}`} />
                <span>{STATUS_LABELS[status]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day headers */}
          <div className="flex border-b border-gray-200">
            <div className="w-48 shrink-0 px-3 py-2 text-xs font-medium text-gray-500 uppercase bg-gray-50 border-r border-gray-200">
              Driver
            </div>
            <div className="flex-1 flex">
              {dayLabels.map((day, i) => (
                <div
                  key={i}
                  className="flex-1 px-2 py-2 text-xs text-center text-gray-500 border-r border-gray-100 last:border-r-0"
                >
                  {day.label}
                </div>
              ))}
            </div>
          </div>

          {/* Driver rows */}
          {drivers.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No active drivers to display
            </div>
          )}

          {drivers.map((driver) => {
            const key = `${driver.first_name}|${driver.last_name}`
            const driverDispatches = dispatchesByDriver.get(key) || []

            return (
              <div
                key={driver.id}
                className="flex border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer min-h-[48px]"
                onClick={() => onSelectDriver?.(driver.id)}
              >
                {/* Driver name */}
                <div className="w-48 shrink-0 px-3 py-3 border-r border-gray-200 flex items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {driver.first_name} {driver.last_name}
                    </p>
                    {driverDispatches.length === 0 && (
                      <p className="text-xs text-green-600 font-medium">Available</p>
                    )}
                  </div>
                </div>

                {/* Timeline bars */}
                <div className="flex-1 relative py-2">
                  {/* Day grid lines */}
                  {dayLabels.map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-r border-gray-100"
                      style={{ left: `${(i / TIMELINE_DAYS) * 100}%` }}
                    />
                  ))}

                  {/* Current time marker */}
                  {nowPct >= 0 && nowPct <= 100 && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                      style={{ left: `${nowPct}%` }}
                      title="Current time"
                    />
                  )}

                  {/* Dispatch bars */}
                  {driverDispatches.map((dispatch) => {
                    const barStyle = getBarStyle(dispatch)
                    if (!barStyle) return null

                    const colorClass = STATUS_COLORS[dispatch.status] || 'bg-gray-400'

                    return (
                      <div
                        key={dispatch.id}
                        className={`absolute top-2 h-7 ${colorClass} rounded-md shadow-sm flex items-center px-2 overflow-hidden`}
                        style={{ left: barStyle.left, width: barStyle.width }}
                        title={`${dispatch.load_number || 'Load'}: ${dispatch.pickup_city || '?'} -> ${dispatch.delivery_city || '?'} (${dispatch.status})`}
                      >
                        <span className="text-xs text-white font-medium truncate">
                          {dispatch.load_number || '---'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
