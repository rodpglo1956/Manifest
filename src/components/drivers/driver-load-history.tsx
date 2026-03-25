'use client'

import Link from 'next/link'
import type { Load } from '@/types/database'
import { StatusBadge } from '@/components/ui/status-badge'

interface DriverLoadHistoryProps {
  loads: Load[]
}

/**
 * Load history list for the Driver PWA.
 * Shows past 30 days of loads with links to detail view.
 */
export function DriverLoadHistory({ loads }: DriverLoadHistoryProps) {
  if (loads.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <p className="text-gray-500 text-sm">No load history in the past 30 days.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {loads.map((load) => (
        <Link
          key={load.id}
          href={`/driver/loads/${load.id}`}
          className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors active:bg-gray-50"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono font-semibold text-gray-900">
              {load.load_number || load.id.slice(0, 8)}
            </span>
            <StatusBadge status={load.status} variant="load" />
          </div>
          <p className="text-sm text-gray-600">
            {[load.pickup_city, load.pickup_state].filter(Boolean).join(', ') || 'N/A'}
            {' '}
            &rarr;{' '}
            {[load.delivery_city, load.delivery_state].filter(Boolean).join(', ') || 'N/A'}
          </p>
          {load.pickup_date && (
            <p className="text-xs text-gray-400 mt-1">
              {new Date(load.pickup_date).toLocaleDateString()}
            </p>
          )}
        </Link>
      ))}
    </div>
  )
}
