'use client'

import { useState, useMemo } from 'react'
import MapGL, { Source, Layer, NavigationControl, Popup } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { getCityCoords } from '@/lib/geo/city-coords'
import type { CrmLane } from '@/types/database'
import type { LayerProps } from 'react-map-gl/maplibre'

interface LaneMapProps {
  lanes: CrmLane[]
  onSelectLane?: (laneId: string) => void
  singleLane?: boolean
}

type HoverInfo = {
  lng: number
  lat: number
  label: string
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return '#22c55e'
    case 'inactive': return '#9ca3af'
    case 'seasonal': return '#f97316'
    default: return '#9ca3af'
  }
}

export default function LaneMap({ lanes, onSelectLane, singleLane = false }: LaneMapProps) {
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null)

  const { geojsonData, markerData, lanesWithoutCoords } = useMemo(() => {
    const features: GeoJSON.Feature[] = []
    const markers: Array<{ id: string; lat: number; lng: number; type: 'origin' | 'destination' }> = []
    const noCoords: CrmLane[] = []

    for (const lane of lanes) {
      const originCoords = getCityCoords(lane.origin_city, lane.origin_state)
      const destCoords = getCityCoords(lane.destination_city, lane.destination_state)

      if (!originCoords || !destCoords) {
        noCoords.push(lane)
        continue
      }

      features.push({
        type: 'Feature',
        properties: {
          id: lane.id,
          status: lane.status,
          color: getStatusColor(lane.status),
          label: `${lane.origin_city}, ${lane.origin_state} -> ${lane.destination_city}, ${lane.destination_state} | ${lane.total_runs} runs | $${lane.avg_rate_per_mile?.toFixed(2) ?? '--'}/mi`,
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [originCoords.lng, originCoords.lat],
            [destCoords.lng, destCoords.lat],
          ],
        },
      })

      markers.push(
        { id: `${lane.id}-o`, lat: originCoords.lat, lng: originCoords.lng, type: 'origin' },
        { id: `${lane.id}-d`, lat: destCoords.lat, lng: destCoords.lng, type: 'destination' },
      )
    }

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features,
    }

    return { geojsonData: geojson, markerData: markers, lanesWithoutCoords: noCoords }
  }, [lanes])

  // Compute bounding box for single lane mode
  const initialViewState = useMemo(() => {
    if (singleLane && lanes.length === 1) {
      const lane = lanes[0]
      const o = getCityCoords(lane.origin_city, lane.origin_state)
      const d = getCityCoords(lane.destination_city, lane.destination_state)
      if (o && d) {
        return {
          latitude: (o.lat + d.lat) / 2,
          longitude: (o.lng + d.lng) / 2,
          zoom: 5,
        }
      }
    }
    return { latitude: 39.8, longitude: -98.5, zoom: 4 }
  }, [lanes, singleLane])

  const lineLayer: LayerProps = {
    id: 'lane-lines',
    type: 'line',
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 2,
      'line-opacity': 0.7,
    },
  }

  const markerLayer: LayerProps = {
    id: 'lane-markers',
    type: 'circle',
    paint: {
      'circle-radius': 5,
      'circle-color': ['match', ['get', 'type'], 'origin', '#22c55e', 'destination', '#ef4444', '#9ca3af'],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1,
    },
  }

  const markerGeojson: GeoJSON.FeatureCollection = useMemo(() => ({
    type: 'FeatureCollection',
    features: markerData.map((m) => ({
      type: 'Feature' as const,
      properties: { id: m.id, type: m.type },
      geometry: { type: 'Point' as const, coordinates: [m.lng, m.lat] },
    })),
  }), [markerData])

  return (
    <div className="space-y-3">
      <div className={`${singleLane ? 'h-[250px]' : 'h-[500px]'} rounded-lg shadow-md overflow-hidden border border-gray-200`}>
        <MapGL
          initialViewState={initialViewState}
          style={{ width: '100%', height: '100%' }}
          mapStyle="https://tiles.openfreemap.org/styles/positron"
          interactiveLayerIds={['lane-lines']}
          onMouseMove={(e) => {
            const feature = e.features?.[0]
            if (feature && feature.properties) {
              setHoverInfo({
                lng: e.lngLat.lng,
                lat: e.lngLat.lat,
                label: feature.properties.label as string,
              })
            } else {
              setHoverInfo(null)
            }
          }}
          onMouseLeave={() => setHoverInfo(null)}
          onClick={(e) => {
            const feature = e.features?.[0]
            if (feature && feature.properties?.id) {
              onSelectLane?.(feature.properties.id as string)
            }
          }}
        >
          <NavigationControl position="top-right" />

          <Source id="lane-lines-src" type="geojson" data={geojsonData}>
            <Layer {...lineLayer} />
          </Source>

          <Source id="lane-markers-src" type="geojson" data={markerGeojson}>
            <Layer {...markerLayer} />
          </Source>

          {hoverInfo && (
            <Popup
              latitude={hoverInfo.lat}
              longitude={hoverInfo.lng}
              closeButton={false}
              closeOnClick={false}
              anchor="bottom"
              offset={[0, -10] as [number, number]}
            >
              <div className="px-2 py-1 text-xs font-medium max-w-xs">
                {hoverInfo.label}
              </div>
            </Popup>
          )}
        </MapGL>
      </div>

      {/* Legend */}
      {!singleLane && (
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-green-500" />
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-gray-400" />
            <span>Inactive</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-orange-500" />
            <span>Seasonal</span>
          </div>
          <div className="flex items-center gap-1 ml-4">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            <span>Origin</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
            <span>Destination</span>
          </div>
        </div>
      )}

      {/* Lanes without coordinates */}
      {!singleLane && lanesWithoutCoords.length > 0 && (
        <div className="text-xs text-gray-400">
          {lanesWithoutCoords.length} lane{lanesWithoutCoords.length > 1 ? 's' : ''} could not be mapped
        </div>
      )}
    </div>
  )
}
