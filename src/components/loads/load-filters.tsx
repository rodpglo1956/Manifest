'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { LOAD_STATUSES } from '@/lib/load-status'
import { getStatusLabel } from '@/lib/load-status'
import { X } from 'lucide-react'
import type { Driver } from '@/types/database'

interface LoadFiltersProps {
  drivers: Pick<Driver, 'id' | 'first_name' | 'last_name'>[]
}

export function LoadFilters({ drivers }: LoadFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [driverId, setDriverId] = useState(searchParams.get('driver_id') ?? '')
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') ?? '')
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') ?? '')
  const [broker, setBroker] = useState(searchParams.get('broker') ?? '')

  const updateFilters = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      router.push(`/loads?${params.toString()}`)
    },
    [router, searchParams]
  )

  // Sync local state on external searchParams change
  useEffect(() => {
    setStatus(searchParams.get('status') ?? '')
    setDriverId(searchParams.get('driver_id') ?? '')
    setDateFrom(searchParams.get('date_from') ?? '')
    setDateTo(searchParams.get('date_to') ?? '')
    setBroker(searchParams.get('broker') ?? '')
  }, [searchParams])

  const hasFilters = status || driverId || dateFrom || dateTo || broker

  function clearFilters() {
    setStatus('')
    setDriverId('')
    setDateFrom('')
    setDateTo('')
    setBroker('')
    router.push('/loads')
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Status */}
      <div className="space-y-1">
        <label htmlFor="filter-status" className="text-xs font-medium text-gray-500">
          Status
        </label>
        <select
          id="filter-status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            updateFilters({ status: e.target.value })
          }}
          className="block w-36 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          {LOAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {getStatusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      {/* Driver */}
      <div className="space-y-1">
        <label htmlFor="filter-driver" className="text-xs font-medium text-gray-500">
          Driver
        </label>
        <select
          id="filter-driver"
          value={driverId}
          onChange={(e) => {
            setDriverId(e.target.value)
            updateFilters({ driver_id: e.target.value })
          }}
          className="block w-40 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Drivers</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.first_name} {d.last_name}
            </option>
          ))}
        </select>
      </div>

      {/* Date From */}
      <div className="space-y-1">
        <label htmlFor="filter-date-from" className="text-xs font-medium text-gray-500">
          Pickup From
        </label>
        <input
          type="date"
          id="filter-date-from"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value)
            updateFilters({ date_from: e.target.value })
          }}
          className="block w-36 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Date To */}
      <div className="space-y-1">
        <label htmlFor="filter-date-to" className="text-xs font-medium text-gray-500">
          Pickup To
        </label>
        <input
          type="date"
          id="filter-date-to"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value)
            updateFilters({ date_to: e.target.value })
          }}
          className="block w-36 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Broker */}
      <div className="space-y-1">
        <label htmlFor="filter-broker" className="text-xs font-medium text-gray-500">
          Broker
        </label>
        <input
          type="text"
          id="filter-broker"
          placeholder="Search broker..."
          value={broker}
          onChange={(e) => setBroker(e.target.value)}
          onBlur={() => updateFilters({ broker })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') updateFilters({ broker })
          }}
          className="block w-40 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </button>
      )}
    </div>
  )
}
