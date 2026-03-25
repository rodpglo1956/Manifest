'use server'

import { createClient } from '@/lib/supabase/server'
import { canDispatchTransition } from '@/lib/dispatch-status'
import { createDispatchSchema } from '@/schemas/dispatch'
import { revalidatePath } from 'next/cache'
import type { DispatchStatus } from '@/types/database'

/**
 * Create a dispatch: assign a driver (and optionally a vehicle) to a load.
 * - Validates load is in 'booked' status
 * - Checks driver has no active dispatch
 * - Creates dispatch record with status='assigned'
 * - Updates load: status='dispatched', driver_id, vehicle_id
 */
export async function createDispatch(formData: FormData): Promise<{ error?: string }> {
  const raw = {
    load_id: formData.get('load_id'),
    driver_id: formData.get('driver_id'),
    vehicle_id: formData.get('vehicle_id') || undefined,
    estimated_pickup_arrival: formData.get('estimated_pickup_arrival') || undefined,
    estimated_delivery_arrival: formData.get('estimated_delivery_arrival') || undefined,
    dispatcher_notes: formData.get('dispatcher_notes') || undefined,
  }

  const parsed = createDispatchSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const supabase = await createClient()

  // Validate load is in 'booked' status
  const { data: load, error: loadFetchError } = await supabase
    .from('loads')
    .select('id, status, org_id')
    .eq('id', data.load_id)
    .single()

  if (loadFetchError || !load) {
    return { error: 'Load not found' }
  }

  if (load.status !== 'booked') {
    return { error: 'Load must be in booked status to dispatch' }
  }

  // Check driver has no active dispatch
  const { data: activeDispatch } = await supabase
    .from('dispatches')
    .select('id')
    .eq('driver_id', data.driver_id)
    .not('status', 'in', '("completed","rejected")')
    .limit(1)
    .maybeSingle()

  if (activeDispatch) {
    return { error: 'Driver already has an active dispatch' }
  }

  // If vehicle_id not provided, use driver's current_vehicle_id
  let vehicleId = data.vehicle_id
  if (!vehicleId) {
    const { data: driver } = await supabase
      .from('drivers')
      .select('current_vehicle_id')
      .eq('id', data.driver_id)
      .single()

    vehicleId = driver?.current_vehicle_id ?? undefined
  }

  // Get current user for assigned_by
  const { data: { user } } = await supabase.auth.getUser()

  // Create dispatch record
  const { error: dispatchError } = await supabase
    .from('dispatches')
    .insert({
      org_id: load.org_id,
      load_id: data.load_id,
      driver_id: data.driver_id,
      vehicle_id: vehicleId ?? null,
      status: 'assigned',
      dispatcher_notes: data.dispatcher_notes || null,
      estimated_pickup_arrival: data.estimated_pickup_arrival ?? null,
      estimated_delivery_arrival: data.estimated_delivery_arrival ?? null,
      assigned_by: user?.id ?? null,
    })

  if (dispatchError) {
    return { error: dispatchError.message }
  }

  // Update load: status -> 'dispatched', set driver_id and vehicle_id
  const { error: loadError } = await supabase
    .from('loads')
    .update({
      status: 'dispatched',
      driver_id: data.driver_id,
      vehicle_id: vehicleId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.load_id)

  if (loadError) {
    return { error: loadError.message }
  }

  revalidatePath('/dispatch')
  revalidatePath('/loads')
  return {}
}

/**
 * Update a dispatch's status (used by dispatchers in Command mode).
 * Validates the status transition is allowed.
 */
export async function updateDispatchStatus(
  dispatchId: string,
  newStatus: DispatchStatus
): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Fetch current dispatch
  const { data: dispatch, error: fetchError } = await supabase
    .from('dispatches')
    .select('id, status')
    .eq('id', dispatchId)
    .single()

  if (fetchError || !dispatch) {
    return { error: 'Dispatch not found' }
  }

  // Validate transition
  if (!canDispatchTransition(dispatch.status as DispatchStatus, newStatus)) {
    return { error: `Invalid status transition from ${dispatch.status} to ${newStatus}` }
  }

  // Build update payload
  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  }

  if (newStatus === 'completed') {
    updateData.completed_at = new Date().toISOString()
  }

  if (newStatus === 'accepted') {
    updateData.accepted_at = new Date().toISOString()
  }

  // Update dispatch
  const { error: updateError } = await supabase
    .from('dispatches')
    .update(updateData)
    .eq('id', dispatchId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/dispatch')
  return {}
}
