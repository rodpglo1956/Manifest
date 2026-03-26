/* eslint-disable @typescript-eslint/no-explicit-any */
// Centralized notification dispatcher
// Routes notifications to enabled channels (in-app, push, email, SMS)

import { sendPushToUser } from '@/lib/push/send-notification'
import type { NotificationCategory, NotificationPriority } from '@/types/database'

type SupabaseClient = {
  from: (table: string) => any
}

type NotificationInput = {
  org_id: string
  user_id: string
  category: NotificationCategory
  priority?: NotificationPriority
  title: string
  body: string
  action_url?: string
  action_label?: string
}

type NotificationRecord = {
  id: string
  org_id: string
  user_id: string
  category: NotificationCategory
  priority: NotificationPriority
  title: string
  body: string
  action_url: string | null
  action_label: string | null
  read: boolean
  read_at: string | null
  channels_sent: string[]
  created_at: string
}

// Map category to the preferences column name
const CATEGORY_CHANNEL_MAP: Record<NotificationCategory, string> = {
  compliance: 'compliance_channels',
  maintenance: 'maintenance_channels',
  load: 'load_channels',
  billing: 'billing_channels',
  crm: 'crm_channels',
  driver: 'driver_channels',
  system: 'system_channels',
  marie: 'marie_channels',
}

/**
 * Check if current time falls within quiet hours for the user's timezone
 */
function isQuietHours(
  quietStart: string | null,
  quietEnd: string | null,
  timezone: string
): boolean {
  if (!quietStart || !quietEnd) return false

  try {
    const now = new Date()
    // Get current time in user's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const parts = formatter.formatToParts(now)
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0')
    const currentMinutes = hour * 60 + minute

    const [startH, startM] = quietStart.split(':').map(Number)
    const [endH, endM] = quietEnd.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes
    }
    return currentMinutes >= startMinutes && currentMinutes < endMinutes
  } catch {
    return false
  }
}

/**
 * Placeholder for email dispatch (Resend integration deferred)
 */
function sendEmailNotification(
  _userId: string,
  _title: string,
  _body: string
): void {
  console.log('Email dispatch not configured')
}

/**
 * Placeholder for SMS dispatch (Twilio integration deferred)
 */
function sendSmsNotification(
  _userId: string,
  _title: string,
  _body: string
): void {
  console.log('SMS dispatch not configured')
}

/**
 * Dispatch a notification to all enabled channels for the user
 *
 * 1. Inserts notification into DB (in-app channel)
 * 2. Loads user preferences for channel routing
 * 3. Respects quiet hours for push/email/sms
 * 4. Routes to enabled channels (push, email, sms)
 * 5. Updates channels_sent on the notification record
 */
export async function dispatchNotification(
  supabase: SupabaseClient,
  notification: NotificationInput
): Promise<NotificationRecord | null> {
  const { org_id, user_id, category, priority = 'normal', title, body, action_url, action_label } = notification

  // 1. Insert notification (always stored for in-app)
  const { data: record, error: insertError } = await supabase
    .from('notifications')
    .insert({
      org_id,
      user_id,
      category,
      priority,
      title,
      body,
      action_url: action_url ?? null,
      action_label: action_label ?? null,
    })
    .select()
    .single()

  if (insertError || !record) {
    console.error('Failed to insert notification:', insertError)
    return null
  }

  const channelsSent: string[] = ['in_app']

  // 2. Load user preferences
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user_id)
    .single()

  if (prefs) {
    const channelColumn = CATEGORY_CHANNEL_MAP[category]
    const enabledChannels: string[] = (prefs as Record<string, any>)[channelColumn] || ['in_app']
    const quiet = isQuietHours(prefs.quiet_hours_start, prefs.quiet_hours_end, prefs.timezone || 'America/New_York')

    // 3. Route to each enabled channel
    for (const channel of enabledChannels) {
      if (channel === 'in_app') continue // Already stored

      // Skip disruptive channels during quiet hours
      if (quiet && (channel === 'push' || channel === 'email' || channel === 'sms')) {
        continue
      }

      if (channel === 'push') {
        // Fire-and-forget per Phase 6 convention
        sendPushToUser(supabase, user_id, {
          title,
          body,
          url: action_url,
          tag: category,
        }).catch(() => {})
        channelsSent.push('push')
      }

      if (channel === 'email') {
        sendEmailNotification(user_id, title, body)
        channelsSent.push('email')
      }

      if (channel === 'sms') {
        sendSmsNotification(user_id, title, body)
        channelsSent.push('sms')
      }
    }
  }

  // 4. Update channels_sent on the record
  await supabase
    .from('notifications')
    .update({ channels_sent: channelsSent })
    .eq('id', (record as NotificationRecord).id)

  return { ...(record as NotificationRecord), channels_sent: channelsSent }
}
