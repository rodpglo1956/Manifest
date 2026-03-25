import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { NotificationPreferencesForm } from './notification-preferences-form'

export const metadata: Metadata = {
  title: 'Notifications | Manifest',
}

export type NotificationPreferences = {
  new_dispatch: boolean
  load_status_change: boolean
  critical_alert: boolean
  invoice_paid: boolean
  driver_response: boolean
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  new_dispatch: true,
  load_status_change: true,
  critical_alert: true,
  invoice_paid: true,
  driver_response: true,
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('notification_preferences')
    .eq('id', user.id)
    .single()

  const preferences: NotificationPreferences = {
    ...DEFAULT_PREFERENCES,
    ...(profile?.notification_preferences as Partial<NotificationPreferences> | null),
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        Notification Preferences
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Choose which notifications you want to receive.
      </p>
      <NotificationPreferencesForm preferences={preferences} />
    </div>
  )
}
