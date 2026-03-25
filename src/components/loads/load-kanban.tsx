'use client'

import Link from 'next/link'
import { LOAD_STATUSES, getStatusLabel } from '@/lib/load-status'
import { StatusBadge } from '@/components/ui/status-badge'
import type { Load } from '@/types/database'

interface LoadKanbanProps {
  loads: (Load & {
    driver_first_name?: string | null
    driver_last_name?: string | null
  })[]
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return '--'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDate(date: string | null): string {
  if (!date) return ''
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function LoadKanban({ loads }: LoadKanbanProps) {
  // Group loads by status
  const grouped = LOAD_STATUSES.reduce(
    (acc, status) => {
      acc[status] = loads.filter((l) => l.status === status)
      return acc
    },
    {} as Record<string, typeof loads>
  )

  // Only show columns that have loads or are active statuses (not canceled/paid unless they have loads)
  const activeStatuses = LOAD_STATUSES.filter(
    (s) => (grouped[s]?.length ?? 0) > 0 || !['canceled', 'paid'].includes(s)
  )

  return (
    <div className="overflow-x-auto pb-4">
      <div className="grid auto-cols-[minmax(250px,1fr)] grid-flow-col gap-4" style={{ minWidth: `${activeStatuses.length * 266}px` }}>
        {activeStatuses.map((status) => {
          const columnLoads = grouped[status] ?? []
          return (
            <div key={status} className="flex flex-col">
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={status} variant="load" />
                </div>
                <span className="text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                  {columnLoads.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2 flex-1">
                {columnLoads.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400">
                    No loads
                  </div>
                ) : (
                  columnLoads.map((load) => (
                    <Link
                      key={load.id}
                      href={`/loads/${load.id}`}
                      className="block rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm font-medium text-primary">
                          {load.load_number ?? '--'}
                        </span>
                        <span className="text-xs font-medium text-gray-700">
                          {formatCurrency(load.total_charges)}
                        </span>
                      </div>

                      {/* Route */}
                      <div className="text-xs text-gray-600 mb-1.5">
                        {load.pickup_city ?? '?'} → {load.delivery_city ?? '?'}
                      </div>

                      {/* Date */}
                      {load.pickup_date && (
                        <div className="text-xs text-gray-400 mb-2">
                          {formatDate(load.pickup_date)}
                        </div>
                      )}

                      {/* Driver */}
                      <div className="text-xs">
                        {load.driver_first_name ? (
                          <span className="text-gray-600">
                            {load.driver_first_name} {load.driver_last_name ?? ''}
                          </span>
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
