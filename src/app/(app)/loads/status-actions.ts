'use server'

import { createClient } from '@/lib/supabase/server'
import { canTransition } from '@/lib/load-status'
import { sendPushToUser } from '@/lib/push/send-notification'
import { revalidatePath } from 'next/cache'
import type { LoadStatus } from '@/types/database'

/**
 * Update a load's status with transition validation.
 * The database trigger (00012) automatically logs to load_status_history.
 */
export async function updateLoadStatus(
  loadId: string,
  newStatus: LoadStatus,
  _notes?: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Fetch current load status and load number
  const { data: load, error: fetchError } = await supabase
    .from('loads')
    .select('id, status, load_number')
    .eq('id', loadId)
    .single()

  if (fetchError || !load) {
    return { error: 'Load not found' }
  }

  // Validate transition
  if (!canTransition(load.status, newStatus)) {
    return { error: `Invalid status transition from ${load.status} to ${newStatus}` }
  }

  // Update status - trigger handles history logging
  const { error: updateError } = await supabase
    .from('loads')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', loadId)

  if (updateError) {
    return { error: updateError.message }
  }

  // --- Post-update: push notification to dispatcher who created the dispatch ---
  try {
    // Find the dispatch for this load to get the dispatcher (assigned_by)
    const { data: dispatch } = await supabase
      .from('dispatches')
      .select('assigned_by')
      .eq('load_id', loadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (dispatch?.assigned_by) {
      // Check dispatcher's notification preferences
      const { data: profile } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', dispatch.assigned_by)
        .single()

      const prefs = profile?.notification_preferences as any
      if (!prefs || prefs.load_status_change !== false) {
        await sendPushToUser(supabase as any, dispatch.assigned_by, {
          title: 'Load Status Update',
          body: `Load ${load.load_number ?? loadId.slice(0, 8)} is now ${newStatus}`,
          url: `/loads/${loadId}`,
          tag: `status-${loadId}`,
        })
      }
    }
  } catch {
    // Push failure should NOT fail the status update (fire-and-forget)
  }

  revalidatePath('/loads')
  return {}
}

/**
 * Update load details (not status - use updateLoadStatus for status changes).
 */
export async function updateLoad(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const updates: Record<string, unknown> = {}

  // Extract form fields that are present
  const fields = [
    'pickup_address', 'pickup_city', 'pickup_state', 'pickup_zip',
    'pickup_date', 'pickup_time', 'pickup_contact_name', 'pickup_contact_phone', 'pickup_notes',
    'delivery_address', 'delivery_city', 'delivery_state', 'delivery_zip',
    'delivery_date', 'delivery_time', 'delivery_contact_name', 'delivery_contact_phone', 'delivery_notes',
    'commodity', 'equipment_type', 'notes',
    'broker_name', 'broker_contact', 'broker_phone', 'broker_email',
    'broker_mc_number', 'broker_reference',
    'driver_id', 'vehicle_id',
  ]

  for (const field of fields) {
    const value = formData.get(field)
    if (value !== null) {
      updates[field] = value === '' ? null : value
    }
  }

  // Numeric fields
  const numericFields = [
    'weight', 'pieces', 'temperature_min', 'temperature_max',
    'rate_amount', 'miles', 'fuel_surcharge', 'accessorial_charges', 'total_charges',
  ]

  for (const field of numericFields) {
    const value = formData.get(field)
    if (value !== null) {
      updates[field] = value === '' ? null : Number(value)
    }
  }

  // Boolean fields
  const hazmatValue = formData.get('hazmat')
  if (hazmatValue !== null) {
    updates.hazmat = hazmatValue === 'true'
  }

  updates.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('loads')
    .update(updates)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/loads')
  revalidatePath(`/loads/${id}`)
  return {}
}

/**
 * Update a document URL field on a load record.
 * Called after uploading a file to Supabase Storage.
 */
export async function uploadDocumentUrl(
  loadId: string,
  docType: 'bol' | 'rate_confirmation' | 'pod',
  storagePath: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const fieldMap: Record<string, string> = {
    bol: 'bol_url',
    rate_confirmation: 'rate_confirmation_url',
    pod: 'pod_url',
  }

  const field = fieldMap[docType]
  if (!field) {
    return { error: 'Invalid document type' }
  }

  const { error } = await supabase
    .from('loads')
    .update({ [field]: storagePath, updated_at: new Date().toISOString() })
    .eq('id', loadId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/loads')
  revalidatePath(`/loads/${loadId}`)
  return {}
}
