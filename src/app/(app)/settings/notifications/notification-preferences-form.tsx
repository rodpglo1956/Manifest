'use client'

import { useTransition, useState } from 'react'
import { updateNotificationPreference } from './actions'
import { usePushSubscription } from '@/hooks/use-push-subscription'
import type { NotificationPreferences } from './page'

const PREFERENCE_LABELS: Record<keyof NotificationPreferences, { label: string; description: string }> = {
  new_dispatch: {
    label: 'New dispatch assigned',
    description: 'When a new dispatch is assigned to you or your team',
  },
  load_status_change: {
    label: 'Load status changes',
    description: 'When a load transitions to a new status',
  },
  critical_alert: {
    label: 'Critical alerts',
    description: 'Urgent issues requiring immediate attention',
  },
  invoice_paid: {
    label: 'Invoice paid',
    description: 'When a customer pays an invoice',
  },
  driver_response: {
    label: 'Driver responses',
    description: 'When a driver accepts or rejects a dispatch',
  },
}

interface NotificationPreferencesFormProps {
  preferences: NotificationPreferences
}

export function NotificationPreferencesForm({
  preferences,
}: NotificationPreferencesFormProps) {
  const [isPending, startTransition] = useTransition()
  const [localPrefs, setLocalPrefs] = useState(preferences)
  const { isSupported, isSubscribed, subscribe, unsubscribe, permission } =
    usePushSubscription()

  const handleToggle = (key: keyof NotificationPreferences) => {
    const newValue = !localPrefs[key]
    setLocalPrefs((prev) => ({ ...prev, [key]: newValue }))

    startTransition(async () => {
      const result = await updateNotificationPreference(key, newValue)
      if (result.error) {
        // Revert on error
        setLocalPrefs((prev) => ({ ...prev, [key]: !newValue }))
      }
    })
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

      {/* Notification type toggles */}
      <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
        {(Object.keys(PREFERENCE_LABELS) as Array<keyof NotificationPreferences>).map(
          (key) => {
            const { label, description } = PREFERENCE_LABELS[key]
            const checked = localPrefs[key]

            return (
              <div
                key={key}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-sm text-gray-500">{description}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={checked}
                  aria-label={label}
                  disabled={isPending}
                  onClick={() => handleToggle(key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 ${
                    checked ? 'bg-primary' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      checked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )
          }
        )}
      </div>
    </div>
  )
}
