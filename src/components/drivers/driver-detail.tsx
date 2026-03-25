'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Driver, Vehicle, Load } from '@/types/database'
import { StatusBadge } from '@/components/ui/status-badge'
import { deactivateDriver, linkDriverToUser } from '@/app/(app)/drivers/actions'

interface DriverDetailProps {
  driver: Driver
  vehicle: Vehicle | null
  recentLoads: Load[]
}

export function DriverDetail({ driver, vehicle, recentLoads }: DriverDetailProps) {
  const [actionLoading, setActionLoading] = useState(false)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [linkEmail, setLinkEmail] = useState(driver.email || '')
  const [linkError, setLinkError] = useState<string | null>(null)
  const [linkSuccess, setLinkSuccess] = useState(false)

  async function handleLinkDriver(e: React.FormEvent) {
    e.preventDefault()
    setActionLoading(true)
    setLinkError(null)
    const result = await linkDriverToUser(driver.id, linkEmail)
    if (result.error) {
      setLinkError(result.error)
    } else {
      setLinkSuccess(true)
      setShowLinkForm(false)
    }
    setActionLoading(false)
  }

  async function handleStatusChange(newStatus: 'inactive' | 'terminated') {
    if (!confirm(`Are you sure you want to mark this driver as ${newStatus}?`)) return
    setActionLoading(true)
    await deactivateDriver(driver.id, newStatus)
    setActionLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {driver.first_name} {driver.last_name}
          </h1>
          <StatusBadge status={driver.status} variant="driver" />
        </div>
        <div className="flex gap-2">
          <Link
            href={`/drivers/${driver.id}/edit`}
            className="px-4 py-2 bg-primary text-white font-medium rounded-md hover:bg-primary-hover transition-colors"
          >
            Edit
          </Link>
          {driver.status === 'active' && (
            <button
              onClick={() => handleStatusChange('inactive')}
              disabled={actionLoading}
              className="px-4 py-2 border border-yellow-300 text-yellow-700 font-medium rounded-md hover:bg-yellow-50 transition-colors disabled:opacity-50"
            >
              Deactivate
            </button>
          )}
          {driver.status !== 'terminated' && (
            <button
              onClick={() => handleStatusChange('terminated')}
              disabled={actionLoading}
              className="px-4 py-2 border border-red-300 text-red-700 font-medium rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Terminate
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Info */}
        <section className="border border-gray-200 rounded-md p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Contact Info
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-900">{driver.email || '--'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Phone</dt>
              <dd className="text-gray-900">{driver.phone || '--'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Home Terminal</dt>
              <dd className="text-gray-900">{driver.home_terminal || '--'}</dd>
            </div>
          </dl>
          {(driver.emergency_contact_name || driver.emergency_contact_phone) && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Emergency Contact</p>
              <p className="text-sm text-gray-900">
                {driver.emergency_contact_name || '--'}
              </p>
              <p className="text-sm text-gray-600">
                {driver.emergency_contact_phone || '--'}
              </p>
            </div>
          )}
        </section>

        {/* License Info */}
        <section className="border border-gray-200 rounded-md p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            License Info
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">License Number</dt>
              <dd className="text-gray-900 font-mono">
                {driver.license_number || '--'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">State</dt>
              <dd className="text-gray-900 font-mono uppercase">
                {driver.license_state || '--'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Class</dt>
              <dd className="text-gray-900">
                {driver.license_class
                  ? `Class ${driver.license_class}`
                  : '--'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Expiration</dt>
              <dd className="text-gray-900">
                {driver.license_expiration
                  ? new Date(driver.license_expiration).toLocaleDateString()
                  : '--'}
              </dd>
            </div>
          </dl>
        </section>

        {/* Assigned Vehicle */}
        <section className="border border-gray-200 rounded-md p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Assigned Vehicle
          </h2>
          {vehicle ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Unit Number</dt>
                <dd className="text-gray-900 font-mono">{vehicle.unit_number}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Vehicle</dt>
                <dd className="text-gray-900">
                  {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') || '--'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <StatusBadge status={vehicle.status} variant="vehicle" />
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-500">Unassigned</p>
          )}
        </section>

        {/* Employment Info */}
        <section className="border border-gray-200 rounded-md p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Employment
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Hire Date</dt>
              <dd className="text-gray-900">
                {driver.hire_date
                  ? new Date(driver.hire_date).toLocaleDateString()
                  : '--'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Status</dt>
              <dd>
                <StatusBadge status={driver.status} variant="driver" />
              </dd>
            </div>
          </dl>
          {driver.notes && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{driver.notes}</p>
            </div>
          )}
        </section>
      </div>

      {/* Link to User Account */}
      {!driver.user_id && !linkSuccess && (
        <section className="border border-gray-200 rounded-md p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            User Account
          </h2>
          <p className="text-sm text-gray-600">
            This driver is not linked to a user account. Link to enable Driver PWA access.
          </p>
          {!showLinkForm ? (
            <button
              onClick={() => setShowLinkForm(true)}
              className="px-4 py-2 bg-primary text-white font-medium rounded-md hover:bg-primary-hover transition-colors text-sm"
            >
              Link to User Account
            </button>
          ) : (
            <form onSubmit={handleLinkDriver} className="flex gap-2 items-end">
              <div className="flex-1">
                <label htmlFor="link-email" className="block text-sm text-gray-600 mb-1">
                  Email address
                </label>
                <input
                  id="link-email"
                  type="email"
                  value={linkEmail}
                  onChange={(e) => setLinkEmail(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-primary text-white font-medium rounded-md hover:bg-primary-hover transition-colors text-sm disabled:opacity-50"
              >
                {actionLoading ? 'Sending...' : 'Send Invite'}
              </button>
              <button
                type="button"
                onClick={() => setShowLinkForm(false)}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </form>
          )}
          {linkError && (
            <p className="text-sm text-red-600">{linkError}</p>
          )}
        </section>
      )}

      {linkSuccess && (
        <section className="border border-green-200 bg-green-50 rounded-md p-4">
          <p className="text-sm text-green-700">
            Invitation sent successfully. The driver will receive an email to set up their account.
          </p>
        </section>
      )}

      {/* Load History */}
      <section className="border border-gray-200 rounded-md p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Recent Load History
        </h2>
        {recentLoads.length === 0 ? (
          <p className="text-sm text-gray-500">No loads assigned yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-3 py-2 font-medium text-gray-700">Load #</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-700">Status</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-700">Pickup Date</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-700">Delivery Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentLoads.map((load) => (
                  <tr key={load.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono">
                      {load.load_number || load.id.slice(0, 8)}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={load.status} variant="load" />
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {load.pickup_date
                        ? new Date(load.pickup_date).toLocaleDateString()
                        : '--'}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {load.delivery_date
                        ? new Date(load.delivery_date).toLocaleDateString()
                        : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
