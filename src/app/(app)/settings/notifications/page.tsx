import type { Metadata } from 'next'
import { NotificationPreferencesForm } from './notification-preferences-form'

export const metadata: Metadata = {
  title: 'Notifications | Manifest',
}

// Phase 6 backward compat type (used by simple toggle preferences)
export type NotificationPreferences = {
  new_dispatch: boolean
  load_status_change: boolean
  critical_alert: boolean
  invoice_paid: boolean
  driver_response: boolean
}

export default function NotificationsPage() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        Notification Preferences
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Control how you receive notifications for each category. Toggle channels per category and configure quiet hours to reduce noise while staying informed.
      </p>
      <NotificationPreferencesForm />
    </div>
  )
}
