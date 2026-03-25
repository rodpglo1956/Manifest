'use server'

import { createClient } from '@/lib/supabase/server'
import { sendPushToOrgAdminsAndDispatchers } from '@/lib/push/send-notification'
import { revalidatePath } from 'next/cache'
import type { ProactiveAlert } from '@/types/database'

/**
 * Fetch unacknowledged alerts for the current user's org.
 * Returns up to 20 alerts ordered by created_at descending.
 */
export async function getUnacknowledgedAlerts(): Promise<ProactiveAlert[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('proactive_alerts')
    .select('*')
    .eq('acknowledged', false)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error || !data) return []
  return data as ProactiveAlert[]
}

/**
 * Acknowledge an alert by setting acknowledged=true and acknowledged_by.
 * Returns error if alert not found or already acknowledged.
 */
export async function acknowledgeAlert(
  alertId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check alert exists and is not already acknowledged
  const { data: alert, error: fetchError } = await supabase
    .from('proactive_alerts')
    .select('id, acknowledged')
    .eq('id', alertId)
    .single()

  if (fetchError || !alert) {
    return { error: 'Alert not found' }
  }

  if (alert.acknowledged) {
    return { error: 'Alert already acknowledged' }
  }

  // Update alert
  const { error: updateError } = await supabase
    .from('proactive_alerts')
    .update({
      acknowledged: true,
      acknowledged_by: user.id,
    })
    .eq('id', alertId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/dashboard')
  return {}
}

/**
 * Get count of unacknowledged alerts for badge display.
 */
export async function getAlertCount(): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('proactive_alerts')
    .select('id', { count: 'exact', head: true })
    .eq('acknowledged', false)

  if (error) return 0
  return count ?? 0
}

/**
 * Send push notification for a critical alert to org admins and dispatchers.
 * Called when new critical alerts are detected (e.g., via Realtime subscription).
 * Best-effort: errors are logged but never thrown.
 */
export async function triggerAlertPush(alert: ProactiveAlert): Promise<void> {
  if (alert.severity !== 'critical') return

  try {
    const supabase = await createClient()
    await sendPushToOrgAdminsAndDispatchers(supabase as any, alert.org_id, {
      title: `Critical Alert: ${alert.title}`,
      body: alert.message,
      url: '/dashboard',
      tag: `alert-${alert.id}`,
    })
  } catch {
    // Push is best-effort -- never break on failure
  }
}
