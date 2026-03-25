'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { NotificationPreferencesV2, NotificationCategory } from '@/types/database'

// Default channels: in-app always enabled, push enabled, email/sms off
const DEFAULT_CHANNELS = ['in_app', 'push']

const ALL_CATEGORIES: NotificationCategory[] = [
  'compliance', 'maintenance', 'load', 'billing', 'crm', 'driver', 'system', 'marie',
]

type ChannelPreferences = Record<string, string[]>

function buildDefaults(): ChannelPreferences {
  const result: ChannelPreferences = {}
  for (const cat of ALL_CATEGORIES) {
    result[`${cat}_channels`] = [...DEFAULT_CHANNELS]
  }
  return result
}

export type NotificationPreferencesFormData = {
  channels: Record<NotificationCategory, string[]>
  quiet_hours_enabled: boolean
  quiet_hours_start: string | null
  quiet_hours_end: string | null
  timezone: string
}

/** Fetch V2 notification preferences for the current user */
export async function getNotificationPreferences(): Promise<{
  data: NotificationPreferencesFormData | null
  error: string | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return { data: null, error: 'Failed to fetch preferences' }
  }

  const defaults = buildDefaults()

  if (!data) {
    // No record yet — return defaults
    return {
      data: {
        channels: ALL_CATEGORIES.reduce((acc, cat) => {
          acc[cat] = defaults[`${cat}_channels`]
          return acc
        }, {} as Record<NotificationCategory, string[]>),
        quiet_hours_enabled: false,
        quiet_hours_start: null,
        quiet_hours_end: null,
        timezone: 'America/New_York',
      },
      error: null,
    }
  }

  const prefs = data as NotificationPreferencesV2
  return {
    data: {
      channels: ALL_CATEGORIES.reduce((acc, cat) => {
        acc[cat] = (prefs as any)[`${cat}_channels`] ?? defaults[`${cat}_channels`]
        return acc
      }, {} as Record<NotificationCategory, string[]>),
      quiet_hours_enabled: prefs.quiet_hours_start !== null,
      quiet_hours_start: prefs.quiet_hours_start,
      quiet_hours_end: prefs.quiet_hours_end,
      timezone: prefs.timezone,
    },
    error: null,
  }
}

/** Upsert V2 notification preferences for the current user */
export async function updateNotificationPreferences(
  formData: NotificationPreferencesFormData
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Build channel maps ensuring in_app is always included
  const ensureInApp = (channels: string[]) =>
    channels.includes('in_app') ? channels : ['in_app', ...channels]

  const update = {
    user_id: user.id,
    timezone: formData.timezone,
    quiet_hours_start: formData.quiet_hours_enabled ? formData.quiet_hours_start : null,
    quiet_hours_end: formData.quiet_hours_enabled ? formData.quiet_hours_end : null,
    compliance_channels: ensureInApp(formData.channels.compliance || []),
    maintenance_channels: ensureInApp(formData.channels.maintenance || []),
    load_channels: ensureInApp(formData.channels.load || []),
    billing_channels: ensureInApp(formData.channels.billing || []),
    crm_channels: ensureInApp(formData.channels.crm || []),
    driver_channels: ensureInApp(formData.channels.driver || []),
    system_channels: ensureInApp(formData.channels.system || []),
    marie_channels: ensureInApp(formData.channels.marie || []),
  }

  const { error } = await supabase
    .from('notification_preferences')
    .upsert(update, { onConflict: 'user_id' })

  if (error) {
    return { error: 'Failed to update preferences' }
  }

  revalidatePath('/settings/notifications')
  return { error: null }
}

// === Backward compat: Phase 6 simple boolean preferences ===

export async function updateNotificationPreference(
  key: string,
  value: boolean
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('notification_preferences')
    .eq('id', user.id)
    .single()

  const current = (profile?.notification_preferences as Record<string, boolean>) || {}
  const updated = { ...current, [key]: value }

  const { error } = await supabase
    .from('profiles')
    .update({ notification_preferences: updated } as any)
    .eq('id', user.id)

  if (error) {
    return { error: 'Failed to update preference' }
  }

  revalidatePath('/settings/notifications')
  return { error: null }
}
