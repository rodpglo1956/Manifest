'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

  // Get current preferences
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
