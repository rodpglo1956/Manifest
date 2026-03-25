'use server'

import { createClient } from '@/lib/supabase/server'
import { canTransition } from '@/lib/load-status'
import { revalidatePath } from 'next/cache'
import type { LoadStatus } from '@/types/database'

/**
 * Update a load's status from the Driver PWA.
 * Scoped: verifies the current user's driver record is assigned to the load.
 */
export async function driverUpdateStatus(
  loadId: string,
  newStatus: LoadStatus
): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get driver record for this user
  const { data: driver } = await supabase
    .from('drivers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!driver) {
    return { error: 'No driver record linked to your account' }
  }

  // Fetch load and verify driver assignment
  const { data: load, error: fetchError } = await supabase
    .from('loads')
    .select('id, status, driver_id')
    .eq('id', loadId)
    .single()

  if (fetchError || !load) {
    return { error: 'Load not found' }
  }

  if (load.driver_id !== driver.id) {
    return { error: 'You are not assigned to this load' }
  }

  // Validate transition
  if (!canTransition(load.status, newStatus)) {
    return { error: `Invalid status transition from ${load.status} to ${newStatus}` }
  }

  // Update status
  const { error: updateError } = await supabase
    .from('loads')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', loadId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/driver/loads')
  revalidatePath(`/driver/loads/${loadId}`)
  return {}
}

/**
 * Upload a BOL or POD document from the Driver PWA.
 * Drivers can only upload BOL and POD (not rate_confirmation).
 */
export async function driverUploadDocument(
  loadId: string,
  docType: 'bol' | 'pod',
  storagePath: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get driver record
  const { data: driver } = await supabase
    .from('drivers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!driver) {
    return { error: 'No driver record linked to your account' }
  }

  // Verify driver is assigned to this load
  const { data: load } = await supabase
    .from('loads')
    .select('id, driver_id')
    .eq('id', loadId)
    .single()

  if (!load || load.driver_id !== driver.id) {
    return { error: 'You are not assigned to this load' }
  }

  // Update document URL
  const field = docType === 'bol' ? 'bol_url' : 'pod_url'
  const { error } = await supabase
    .from('loads')
    .update({ [field]: storagePath, updated_at: new Date().toISOString() })
    .eq('id', loadId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/driver/loads')
  revalidatePath(`/driver/loads/${loadId}`)
  return {}
}
