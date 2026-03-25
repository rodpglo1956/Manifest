'use server'

import { createClient } from '@/lib/supabase/server'
import { dispatchNotification } from '@/lib/notifications/dispatcher'
import type { NotificationCategory, NotificationPriority, Notification } from '@/types/database'

async function getAuthContext() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' as const, supabase, user: null, orgId: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) {
    return { error: 'No organization' as const, supabase, user, orgId: null }
  }

  return { error: null, supabase, user, orgId: profile.org_id }
}

/**
 * Fetch recent notifications for the current user
 */
export async function getNotifications(limit: number = 20): Promise<{
  data: Notification[] | null
  error: string | null
}> {
  const { error, supabase, user } = await getAuthContext()
  if (error || !user) return { data: null, error: error || 'Not authenticated' }

  const { data, error: fetchError } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (fetchError) return { data: null, error: fetchError.message }
  return { data: data as Notification[], error: null }
}

/**
 * Get count of unread notifications for the current user
 */
export async function getUnreadCount(): Promise<{
  count: number
  error: string | null
}> {
  const { error, supabase, user } = await getAuthContext()
  if (error || !user) return { count: 0, error: error || 'Not authenticated' }

  const { count, error: countError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (countError) return { count: 0, error: countError.message }
  return { count: count || 0, error: null }
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(notificationId: string): Promise<{
  error: string | null
}> {
  const { error, supabase, user } = await getAuthContext()
  if (error || !user) return { error: error || 'Not authenticated' }

  const { error: updateError } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (updateError) return { error: updateError.message }
  return { error: null }
}

/**
 * Mark all unread notifications as read for the current user
 */
export async function markAllAsRead(): Promise<{
  error: string | null
}> {
  const { error, supabase, user } = await getAuthContext()
  if (error || !user) return { error: error || 'Not authenticated' }

  const { error: updateError } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('read', false)

  if (updateError) return { error: updateError.message }
  return { error: null }
}

/**
 * Create and dispatch a notification (server action wrapper)
 */
export async function createNotification(data: {
  user_id: string
  category: NotificationCategory
  priority?: NotificationPriority
  title: string
  body: string
  action_url?: string
  action_label?: string
}): Promise<{
  data: Notification | null
  error: string | null
}> {
  const { error, supabase, orgId } = await getAuthContext()
  if (error || !orgId) return { data: null, error: error || 'No organization' }

  const result = await dispatchNotification(supabase, {
    org_id: orgId,
    ...data,
  })

  if (!result) return { data: null, error: 'Failed to dispatch notification' }
  return { data: result as Notification, error: null }
}
