// Server-side push notification sender
// Uses web-push library with VAPID authentication

import webpush from 'web-push'
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } from '@/lib/push/vapid'
import type { UserRole } from '@/types/database'

// Configure VAPID details
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

type PushPayload = {
  title: string
  body: string
  url?: string
  tag?: string
}

type SubscriptionRecord = {
  id: string
  endpoint: string
  keys_p256dh: string
  keys_auth: string
}

// SupabaseClient-like interface for flexibility in testing
type SupabaseClient = {
  from: (table: string) => any
}

/**
 * Send push notification to all devices registered for a user
 * Automatically cleans up expired subscriptions (410 Gone)
 */
export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: PushPayload
): Promise<void> {
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, keys_p256dh, keys_auth')
    .eq('user_id', userId)

  if (error || !subscriptions?.length) return

  const expiredIds: string[] = []

  await Promise.allSettled(
    (subscriptions as SubscriptionRecord[]).map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys_p256dh,
              auth: sub.keys_auth,
            },
          },
          JSON.stringify(payload)
        )
      } catch (err: any) {
        if (err?.statusCode === 410) {
          expiredIds.push(sub.id)
        }
        // Other errors (network, etc.) are silently ignored per-subscription
      }
    })
  )

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    for (const id of expiredIds) {
      await supabase.from('push_subscriptions').delete().eq('id', id)
    }
  }
}

/**
 * Send push notification to all users with a specific role in an org
 */
export async function sendPushToRole(
  supabase: SupabaseClient,
  orgId: string,
  role: UserRole,
  payload: PushPayload
): Promise<void> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('org_id', orgId)
    .eq('role', role)

  if (error || !profiles?.length) return

  await Promise.allSettled(
    profiles.map((p: { id: string }) => sendPushToUser(supabase, p.id, payload))
  )
}

/**
 * Send push notification to all admins and dispatchers in an org
 * Used for critical alerts that need immediate attention
 */
export async function sendPushToOrgAdminsAndDispatchers(
  supabase: SupabaseClient,
  orgId: string,
  payload: PushPayload
): Promise<void> {
  await Promise.allSettled([
    sendPushToRole(supabase, orgId, 'admin', payload),
    sendPushToRole(supabase, orgId, 'dispatcher', payload),
  ])
}
