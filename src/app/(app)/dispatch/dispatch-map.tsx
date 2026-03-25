'use client'

import { useState, useMemo } from 'react'
import MapGL, { Marker, NavigationControl, Popup } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { getCityCoords } from '@/lib/geo/city-coords'
import type { Load, Driver } from '@/types/database'
import type { ActiveDispatch } from '@/components/dispatch/active-dispatches-list'

interface DispatchMapProps {
  loads: Load[]
  drivers: Driver[]
  activeDispatches?: ActiveDispatch[]
  onSelectLoad?: (loadId: string) => void
}

type PopupInfo = {
  type: 'load' | 'driver'
  lat: number
  lng: number
  label: string
}

type LoadPin = {
  id: string
  lat: number
  lng: number
  loadNumber: string | null
}

type DriverPin = {
  id: string
  lat: number
  lng: number
  name: string
}

export default function DispatchMap({ loads, drivers, activeDispatches = [], onSelectLoad }: DispatchMapProps) {
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null)

  // Compute load pins from pickup city/state
  const { loadPins, loadsWithoutLocation } = useMemo(() => {
    const pins: LoadPin[] = []
    const noLoc: Load[] = []

    for (const load of loads) {
      const coords = getCityCoords(load.pickup_city, load.pickup_state)
      if (coords) {
        pins.push({
          id: load.id,
          lat: coords.lat,
          lng: coords.lng,
          loadNumber: load.load_number,
        })
      } else {
        noLoc.push(load)
      }
    }

    return { loadPins: pins, loadsWithoutLocation: noLoc }
  }, [loads])

  // Compute driver pins from last delivery location or home_terminal
  const { driverPins, driversWithoutLocation } = useMemo(() => {
    const pins: DriverPin[] = []
    const noLoc: Driver[] = []

    // Build a map of driver -> last delivery city/state from active dispatches
    const driverLastDelivery = new Map<string, { city: string | null; state: string | null }>()
    for (const dispatch of activeDispatches) {
      if (dispatch.delivery_city && dispatch.delivery_state) {
        driverLastDelivery.set(dispatch.driver_first_name + dispatch.driver_last_name, {
          city: dispatch.delivery_city,
          state: dispatch.delivery_state,
        })
      }
    }

    for (const driver of drivers) {
      // Try last delivery location from dispatches
      const driverKey = driver.first_name + driver.last_name
      const lastDelivery = driverLastDelivery.get(driverKey)
      let coords = lastDelivery ? getCityCoords(lastDelivery.city, lastDelivery.state) : null

      // Fallback to home_terminal (format: "City, ST")
      if (!coords && driver.home_terminal) {
        const parts = driver.home_terminal.split(',').map((p) => p.trim())
        if (parts.length === 2) {
          coords = getCityCoords(parts[0], parts[1])
        }
      }

      if (coords) {
        pins.push({
          id: driver.id,
          lat: coords.lat,
          lng: coords.lng,
          name: `${driver.first_name} ${driver.last_name}`,
        })
      } else {
        noLoc.push(driver)
      }
    }

    return { driverPins: pins, driversWithoutLocation: noLoc }
  }, [drivers, activeDispatches])

  return (
    <div className="space-y-3">
      <div className="h-[500px] rounded-lg shadow-md overflow-hidden border border-gray-200">
        <MapGL
          initialViewState={{
            latitude: 39.8,
            longitude: -98.5,
            zoom: 4,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="https://tiles.openfreemap.org/styles/positron"
        >
          <NavigationControl position="top-right" />

          {/* Load pins - pink */}
          {loadPins.map((pin) => (
            <Marker
              key={`load-${pin.id}`}
              latitude={pin.lat}
              longitude={pin.lng}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                onSelectLoad?.(pin.id)
              }}
            >
              <div
                className="cursor-pointer"
                onMouseEnter={() =>
                  setPopupInfo({
                    type: 'load',
                    lat: pin.lat,
                    lng: pin.lng,
                    label: pin.loadNumber || 'No number',
                  })
                }
                onMouseLeave={() => setPopupInfo(null)}
              >
                <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
                  <path
                    d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20C24 5.373 18.627 0 12 0z"
                    fill="#EC008C"
                  />
                  <circle cx="12" cy="12" r="5" fill="white" />
                </svg>
              </div>
            </Marker>
          ))}

          {/* Driver pins - blue */}
          {driverPins.map((pin) => (
            <Marker
              key={`driver-${pin.id}`}
              latitude={pin.lat}
              longitude={pin.lng}
              anchor="bottom"
            >
              <div
                onMouseEnter={() =>
                  setPopupInfo({
                    type: 'driver',
                    lat: pin.lat,
                    lng: pin.lng,
                    label: pin.name,
                  })
                }
                onMouseLeave={() => setPopupInfo(null)}
              >
                <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
                  <path
                    d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20C24 5.373 18.627 0 12 0z"
                    fill="#3B82F6"
                  />
                  <circle cx="12" cy="12" r="5" fill="white" />
                </svg>
              </div>
            </Marker>
          ))}

          {/* Hover popup */}
          {popupInfo && (
            <Popup
              latitude={popupInfo.lat}
              longitude={popupInfo.lng}
              closeButton={false}
              closeOnClick={false}
              anchor="bottom"
              offset={[0, -32] as [number, number]}
            >
              <div className="px-2 py-1 text-xs font-medium">
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-1 ${
                    popupInfo.type === 'load' ? 'bg-[#EC008C]' : 'bg-[#3B82F6]'
                  }`}
                />
                {popupInfo.label}
              </div>
            </Popup>
          )}
        </MapGL>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-[#EC008C]" />
          <span>Loads ({loadPins.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-[#3B82F6]" />
          <span>Drivers ({driverPins.length})</span>
        </div>
        {driversWithoutLocation.length > 0 && (
          <div className="text-gray-400">
            {driversWithoutLocation.length} driver{driversWithoutLocation.length > 1 ? 's' : ''} location unknown
          </div>
        )}
      </div>

      {/* Loads without location */}
      {loadsWithoutLocation.length > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Loads without location ({loadsWithoutLocation.length})
          </h4>
          <div className="space-y-1">
            {loadsWithoutLocation.map((load) => (
              <button
                key={load.id}
                onClick={() => onSelectLoad?.(load.id)}
                className="block w-full text-left text-sm text-gray-700 hover:text-primary hover:bg-gray-100 px-2 py-1 rounded transition-colors"
              >
                <span className="font-medium">{load.load_number || 'No number'}</span>
                {load.pickup_city && (
                  <span className="text-gray-400 ml-2">
                    {load.pickup_city}, {load.pickup_state}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
