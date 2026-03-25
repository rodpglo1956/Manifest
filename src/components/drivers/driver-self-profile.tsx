'use client'

import { useState } from 'react'
import type { Driver } from '@/types/database'
import { updateDriverSelf } from '@/app/driver/settings/actions'
import { StatusBadge } from '@/components/ui/status-badge'

interface DriverSelfProfileProps {
  driver: Driver
  vehicleUnitNumber?: string | null
}

/**
 * Driver self-profile view for the Driver PWA.
 * Shows all info read-only except phone and emergency contact.
 */
export function DriverSelfProfile({ driver, vehicleUnitNumber }: DriverSelfProfileProps) {
  const [phone, setPhone] = useState(driver.phone || '')
  const [emergencyName, setEmergencyName] = useState(driver.emergency_contact_name || '')
  const [emergencyPhone, setEmergencyPhone] = useState(driver.emergency_contact_phone || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData()
    formData.set('phone', phone)
    formData.set('emergency_contact_name', emergencyName)
    formData.set('emergency_contact_phone', emergencyPhone)

    const result = await updateDriverSelf(formData)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Name and status header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {driver.first_name} {driver.last_name}
          </h2>
          <StatusBadge status={driver.status} variant="driver" />
        </div>

        {/* Read-only info */}
        <dl className="space-y-3 text-sm">
          {driver.email && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-900">{driver.email}</dd>
            </div>
          )}
          {driver.license_number && (
            <div className="flex justify-between">
              <dt className="text-gray-500">License</dt>
              <dd className="text-gray-900 font-mono">
                {driver.license_number}
                {driver.license_state && ` (${driver.license_state})`}
                {driver.license_class && ` Class ${driver.license_class}`}
              </dd>
            </div>
          )}
          {driver.license_expiration && (
            <div className="flex justify-between">
              <dt className="text-gray-500">License Exp.</dt>
              <dd className="text-gray-900">
                {new Date(driver.license_expiration).toLocaleDateString()}
              </dd>
            </div>
          )}
          {driver.hire_date && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Hire Date</dt>
              <dd className="text-gray-900">
                {new Date(driver.hire_date).toLocaleDateString()}
              </dd>
            </div>
          )}
          {vehicleUnitNumber && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Assigned Vehicle</dt>
              <dd className="text-gray-900 font-mono">Unit #{vehicleUnitNumber}</dd>
            </div>
          )}
          {driver.home_terminal && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Home Terminal</dt>
              <dd className="text-gray-900">{driver.home_terminal}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Editable section */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Editable Information
        </h3>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
            Profile updated successfully.
          </div>
        )}

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            required
          />
        </div>

        <div>
          <label htmlFor="emergency_name" className="block text-sm font-medium text-gray-700 mb-1">
            Emergency Contact Name
          </label>
          <input
            id="emergency_name"
            type="text"
            value={emergencyName}
            onChange={(e) => setEmergencyName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="emergency_phone" className="block text-sm font-medium text-gray-700 mb-1">
            Emergency Contact Phone
          </label>
          <input
            id="emergency_phone"
            type="tel"
            value={emergencyPhone}
            onChange={(e) => setEmergencyPhone(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full min-h-[48px] px-6 py-3 bg-primary text-white text-base font-semibold rounded-lg hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
