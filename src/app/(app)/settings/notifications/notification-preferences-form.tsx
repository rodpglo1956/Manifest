'use client'

import { useTransition, useState, useEffect, useCallback } from 'react'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferencesFormData,
} from './actions'
import { usePushSubscription } from '@/hooks/use-push-subscription'
import type { NotificationCategory } from '@/types/database'

const CATEGORIES: { key: NotificationCategory; label: string }[] = [
  { key: 'compliance', label: 'Compliance' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'load', label: 'Loads' },
  { key: 'billing', label: 'Billing' },
  { key: 'crm', label: 'CRM' },
  { key: 'driver', label: 'Drivers' },
  { key: 'system', label: 'System' },
  { key: 'marie', label: 'Marie' },
]

const CHANNELS: { key: string; label: string; disabled?: boolean }[] = [
  { key: 'in_app', label: 'In-App', disabled: true },
  { key: 'push', label: 'Push' },
  { key: 'email', label: 'Email' },
  { key: 'sms', label: 'SMS' },
]

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'UTC', label: 'UTC' },
]

const DEFAULT_PREFS: NotificationPreferencesFormData = {
  channels: {
    compliance: ['in_app', 'push'],
    maintenance: ['in_app', 'push'],
    load: ['in_app', 'push'],
    billing: ['in_app', 'push'],
    crm: ['in_app', 'push'],
    driver: ['in_app', 'push'],
    system: ['in_app', 'push'],
    marie: ['in_app', 'push'],
  },
  quiet_hours_enabled: false,
  quiet_hours_start: null,
  quiet_hours_end: null,
  timezone: 'America/New_York',
}

export function NotificationPreferencesForm() {
  const [isPending, startTransition] = useTransition()
  const [prefs, setPrefs] = useState<NotificationPreferencesFormData>(DEFAULT_PREFS)
  const [loaded, setLoaded] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const { isSupported, isSubscribed, subscribe, unsubscribe, permission } =
    usePushSubscription()

  useEffect(() => {
    getNotificationPreferences().then(({ data }) => {
      if (data) setPrefs(data)
      setLoaded(true)
    })
  }, [])

  const handleChannelToggle = useCallback(
    (category: NotificationCategory, channel: string) => {
      // in_app is always on
      if (channel === 'in_app') return

      setPrefs((prev) => {
        const current = prev.channels[category] || []
        const hasChannel = current.includes(channel)
        const updated = hasChannel
          ? current.filter((c) => c !== channel)
          : [...current, channel]

        return {
          ...prev,
          channels: { ...prev.channels, [category]: updated },
        }
      })
    },
    []
  )

  const handleSave = useCallback(() => {
    setSaveStatus('saving')
    startTransition(async () => {
      const result = await updateNotificationPreferences(prefs)
      if (result.error) {
        setSaveStatus('error')
      } else {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      }
    })
  }, [prefs, startTransition])

  if (!loaded) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Push subscription status */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Push Notifications
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {!isSupported
                ? 'Push notifications are not supported in this browser.'
                : isSubscribed
                  ? 'This device is receiving push notifications.'
                  : permission === 'denied'
                    ? 'Push notifications are blocked. Please update your browser settings.'
                    : 'Enable push notifications to receive alerts on this device.'}
            </p>
          </div>
          {isSupported && permission !== 'denied' && (
            <button
              onClick={() => (isSubscribed ? unsubscribe() : subscribe())}
              className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium ${
                isSubscribed
                  ? 'text-gray-600 hover:bg-gray-100'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
            </button>
          )}
        </div>
      </div>

      {/* Category x Channel Matrix */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-900">
            Channel Preferences by Category
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Control which channels are enabled for each notification category. In-app notifications are always enabled.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                  Category
                </th>
                {CHANNELS.map((ch) => (
                  <th
                    key={ch.key}
                    className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3"
                  >
                    {ch.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {CATEGORIES.map((cat) => (
                <tr key={cat.key} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {cat.label}
                  </td>
                  {CHANNELS.map((ch) => {
                    const isEnabled =
                      ch.disabled || (prefs.channels[cat.key] || []).includes(ch.key)

                    return (
                      <td key={ch.key} className="text-center px-3 py-3">
                        <button
                          role="switch"
                          aria-checked={isEnabled}
                          aria-label={`${cat.label} ${ch.label}`}
                          disabled={ch.disabled || isPending}
                          onClick={() => handleChannelToggle(cat.key, ch.key)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed ${
                            isEnabled ? 'bg-primary' : 'bg-gray-200'
                          } ${ch.disabled ? 'opacity-60' : ''}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isEnabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Quiet Hours</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Push, email, and SMS notifications will be held during quiet hours. In-app notifications are still stored.
            </p>
          </div>
          <button
            role="switch"
            aria-checked={prefs.quiet_hours_enabled}
            aria-label="Enable quiet hours"
            disabled={isPending}
            onClick={() =>
              setPrefs((prev) => ({
                ...prev,
                quiet_hours_enabled: !prev.quiet_hours_enabled,
                quiet_hours_start: !prev.quiet_hours_enabled ? '22:00' : null,
                quiet_hours_end: !prev.quiet_hours_enabled ? '07:00' : null,
              }))
            }
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 ${
              prefs.quiet_hours_enabled ? 'bg-primary' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                prefs.quiet_hours_enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {prefs.quiet_hours_enabled && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label
                htmlFor="quiet-start"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Start Time
              </label>
              <input
                id="quiet-start"
                type="time"
                value={prefs.quiet_hours_start || '22:00'}
                onChange={(e) =>
                  setPrefs((prev) => ({
                    ...prev,
                    quiet_hours_start: e.target.value,
                  }))
                }
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary"
              />
            </div>
            <div>
              <label
                htmlFor="quiet-end"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                End Time
              </label>
              <input
                id="quiet-end"
                type="time"
                value={prefs.quiet_hours_end || '07:00'}
                onChange={(e) =>
                  setPrefs((prev) => ({
                    ...prev,
                    quiet_hours_end: e.target.value,
                  }))
                }
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary"
              />
            </div>
            <div>
              <label
                htmlFor="timezone"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Timezone
              </label>
              <select
                id="timezone"
                value={prefs.timezone}
                onChange={(e) =>
                  setPrefs((prev) => ({ ...prev, timezone: e.target.value }))
                }
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save Preferences'}
        </button>
        {saveStatus === 'saved' && (
          <span className="text-sm text-green-600">Preferences saved</span>
        )}
        {saveStatus === 'error' && (
          <span className="text-sm text-red-600">Failed to save. Please try again.</span>
        )}
      </div>
    </div>
  )
}
