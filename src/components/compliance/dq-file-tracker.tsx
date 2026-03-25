'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface DriverDQRow {
  id: string
  first_name: string
  last_name: string
  completeness: number
  missingCount: number
  cdl_expiry: string | null
  medical_card_expiry: string | null
}

interface DQFileTrackerProps {
  drivers: DriverDQRow[]
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr + 'T00:00:00').getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function ExpiryBadge({ dateStr, label }: { dateStr: string | null; label: string }) {
  const days = daysUntil(dateStr)

  if (!dateStr || days === null) {
    return <span className="text-xs text-gray-400">{label}: N/A</span>
  }

  const color =
    days < 0
      ? 'text-red-700 bg-red-50'
      : days <= 30
        ? 'text-yellow-700 bg-yellow-50'
        : 'text-green-700 bg-green-50'

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${color}`}>
      {label}: {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
    </span>
  )
}

function CompletenessBar({ percentage }: { percentage: number }) {
  const color =
    percentage >= 80
      ? 'bg-green-500'
      : percentage >= 50
        ? 'bg-yellow-500'
        : 'bg-red-500'

  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-xs text-gray-600 w-8">{percentage}%</span>
    </div>
  )
}

export function DQFileTracker({ drivers }: DQFileTrackerProps) {
  const [search, setSearch] = useState('')
  const [sortAsc, setSortAsc] = useState(true)

  const filtered = useMemo(() => {
    let list = drivers
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (d) =>
          d.first_name.toLowerCase().includes(q) ||
          d.last_name.toLowerCase().includes(q)
      )
    }
    return [...list].sort((a, b) =>
      sortAsc ? a.completeness - b.completeness : b.completeness - a.completeness
    )
  }, [drivers, search, sortAsc])

  if (drivers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No active drivers</p>
        <p className="mt-1 text-sm">Add drivers to begin tracking qualification files.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search drivers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Sort: {sortAsc ? 'Worst first' : 'Best first'}
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completeness</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Missing</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CDL Expiry</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medical Card</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {d.first_name} {d.last_name}
                </td>
                <td className="px-4 py-3">
                  <CompletenessBar percentage={d.completeness} />
                </td>
                <td className="px-4 py-3">
                  {d.missingCount > 0 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                      {d.missingCount}
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                      0
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <ExpiryBadge dateStr={d.cdl_expiry} label="CDL" />
                </td>
                <td className="px-4 py-3">
                  <ExpiryBadge dateStr={d.medical_card_expiry} label="Med" />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/compliance/drivers?driverId=${d.id}`}
                    className="text-sm text-primary hover:text-primary-hover font-medium"
                  >
                    View DQ File
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
