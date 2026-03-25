'use server'

import { createClient } from '@/lib/supabase/server'
import { driverNotesSchema } from '@/schemas/dispatch'
import { revalidatePath } from 'next/cache'

/**
 * Accept a dispatch assignment from the Driver PWA.
 * Sets dispatch status to 'accepted' and accepted_at timestamp.
 * Load remains in 'dispatched' status.
 */
export async function acceptDispatch(dispatchId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Look up driver by user_id
  const { data: driver } = await supabase
    .from('drivers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!driver) {
    return { error: 'No driver record linked to your account' }
  }

  // Verify dispatch belongs to driver and is in 'assigned' status
  const { data: dispatch, error: fetchError } = await supabase
    .from('dispatches')
    .select('id, status, driver_id')
    .eq('id', dispatchId)
    .single()

  if (fetchError || !dispatch) {
    return { error: 'Dispatch not found' }
  }

  if (dispatch.driver_id !== driver.id) {
    return { error: 'This dispatch is not assigned to you' }
  }

  if (dispatch.status !== 'assigned') {
    return { error: 'Dispatch can only be accepted when in assigned status' }
  }

  // Update dispatch: status -> 'accepted', set accepted_at
  const { error: updateError } = await supabase
    .from('dispatches')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', dispatchId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/driver/dispatch')
  revalidatePath('/dispatch')
  return {}
}

/**
 * Reject a dispatch assignment from the Driver PWA.
 * Sets dispatch status to 'rejected'.
 * Reverts load to 'booked' and clears driver_id/vehicle_id.
 */
export async function rejectDispatch(dispatchId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Look up driver by user_id
  const { data: driver } = await supabase
    .from('drivers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!driver) {
    return { error: 'No driver record linked to your account' }
  }

  // Verify dispatch belongs to driver and is in 'assigned' status
  const { data: dispatch, error: fetchError } = await supabase
    .from('dispatches')
    .select('id, status, driver_id, load_id')
    .eq('id', dispatchId)
    .single()

  if (fetchError || !dispatch) {
    return { error: 'Dispatch not found' }
  }

  if (dispatch.driver_id !== driver.id) {
    return { error: 'This dispatch is not assigned to you' }
  }

  if (dispatch.status !== 'assigned') {
    return { error: 'Dispatch can only be rejected when in assigned status' }
  }

  // Update dispatch: status -> 'rejected'
  const { error: dispatchError } = await supabase
    .from('dispatches')
    .update({
      status: 'rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', dispatchId)

  if (dispatchError) {
    return { error: dispatchError.message }
  }

  // Revert load: status -> 'booked', clear driver_id and vehicle_id
  const { error: loadError } = await supabase
    .from('loads')
    .update({
      status: 'booked',
      driver_id: null,
      vehicle_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dispatch.load_id)

  if (loadError) {
    return { error: loadError.message }
  }

  revalidatePath('/driver/dispatch')
  revalidatePath('/dispatch')
  revalidatePath('/loads')
  return {}
}

/**
 * Update driver notes on a dispatch from the Driver PWA.
 */
export async function updateDriverNotes(formData: FormData): Promise<{ error?: string }> {
  const raw = {
    dispatch_id: formData.get('dispatch_id'),
    driver_notes: formData.get('driver_notes'),
  }

  const parsed = driverNotesSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Look up driver by user_id
  const { data: driver } = await supabase
    .from('drivers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!driver) {
    return { error: 'No driver record linked to your account' }
  }

  // Verify dispatch belongs to driver
  const { data: dispatch, error: fetchError } = await supabase
    .from('dispatches')
    .select('id, driver_id')
    .eq('id', data.dispatch_id)
    .single()

  if (fetchError || !dispatch) {
    return { error: 'Dispatch not found' }
  }

  if (dispatch.driver_id !== driver.id) {
    return { error: 'This dispatch is not assigned to you' }
  }

  // Update driver_notes
  const { error: updateError } = await supabase
    .from('dispatches')
    .update({
      driver_notes: data.driver_notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.dispatch_id)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/driver/dispatch')
  return {}
}
