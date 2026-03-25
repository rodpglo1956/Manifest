'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Driver, DriverStatus } from '@/types/database'
import { StatusBadge } from '@/components/ui/status-badge'

interface DriverListProps {
  drivers: Driver[]
}

export function DriverList({ drivers }: DriverListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<DriverStatus | 'all'>('all')

  const filtered = drivers.filter((d) => {
    const matchesSearch =
      search === '' ||
      `${d.first_name} ${d.last_name}`.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DriverStatus | 'all')}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-md">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-700">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">License Class</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Hire Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  {drivers.length === 0
                    ? 'No drivers yet. Add your first driver to get started.'
                    : 'No drivers match your search.'}
                </td>
              </tr>
            ) : (
              filtered.map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/drivers/${driver.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {driver.first_name} {driver.last_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{driver.phone}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {driver.license_class
                      ? `Class ${driver.license_class}`
                      : '--'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={driver.status} variant="driver" />
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {driver.hire_date
                      ? new Date(driver.hire_date).toLocaleDateString()
                      : '--'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-gray-500">
        {filtered.length} of {drivers.length} drivers
      </p>
    </div>
  )
}
