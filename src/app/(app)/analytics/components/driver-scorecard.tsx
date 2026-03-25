'use client'

import { useState } from 'react'
import type { DriverPerformance } from '@/types/database'

type DriverRow = DriverPerformance & { driver_name: string }

type SortField =
  | 'driver_name'
  | 'loads_completed'
  | 'miles_driven'
  | 'revenue_generated'
  | 'on_time_pct'
  | 'fuel_efficiency'
  | 'safety_incidents'
  | 'compliance_score'

interface DriverScorecardProps {
  drivers: DriverRow[]
}

export function DriverScorecard({ drivers }: DriverScorecardProps) {
  const [sortField, setSortField] = useState<SortField>('revenue_generated')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const sorted = [...drivers].sort((a, b) => {
    const aVal = a[sortField] ?? 0
    const bVal = b[sortField] ?? 0
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
  })

  const columns: { key: SortField; label: string; align: 'left' | 'right' }[] = [
    { key: 'driver_name', label: 'Driver Name', align: 'left' },
    { key: 'loads_completed', label: 'Loads', align: 'right' },
    { key: 'miles_driven', label: 'Miles', align: 'right' },
    { key: 'revenue_generated', label: 'Revenue', align: 'right' },
    { key: 'on_time_pct', label: 'On-Time %', align: 'right' },
    { key: 'fuel_efficiency', label: 'MPG', align: 'right' },
    { key: 'safety_incidents', label: 'Safety Incidents', align: 'right' },
    { key: 'compliance_score', label: 'Compliance', align: 'right' },
  ]

  function complianceBadge(score: number | null) {
    if (score === null) return <span className="text-gray-400">--</span>
    if (score > 80)
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {score}%
        </span>
      )
    if (score >= 50)
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          {score}%
        </span>
      )
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        {score}%
      </span>
    )
  }

  if (drivers.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-5">
        <p className="text-gray-400 text-sm py-8 text-center">
          No driver performance data yet. Data is generated nightly.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3 px-4 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-900 transition-colors ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  {sortField === col.key && (
                    <span className="ml-1">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((driver) => {
              const onTimePct = driver.on_time_pct
              let rowBg = ''
              if (onTimePct !== null) {
                if (onTimePct > 90) rowBg = 'bg-green-50'
                else if (onTimePct < 70) rowBg = 'bg-red-50'
              }

              return (
                <tr
                  key={driver.id}
                  className={`border-b border-gray-50 hover:bg-gray-50 ${rowBg}`}
                >
                  <td className="py-3 px-4 font-medium text-gray-900">{driver.driver_name}</td>
                  <td className="py-3 px-4 text-right text-gray-700">{driver.loads_completed}</td>
                  <td className="py-3 px-4 text-right text-gray-700">
                    {driver.miles_driven.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">
                    ${driver.revenue_generated.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">
                    {onTimePct !== null ? `${onTimePct.toFixed(1)}%` : '--'}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">
                    {driver.fuel_efficiency !== null ? driver.fuel_efficiency.toFixed(1) : '--'}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">{driver.safety_incidents}</td>
                  <td className="py-3 px-4 text-right">{complianceBadge(driver.compliance_score)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
