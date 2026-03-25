'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { vehicleSchema } from '@/schemas/vehicle'
import type { VehicleStatus, VehicleType, VehicleClass, FuelType } from '@/types/database'

function extractVehicleFields(formData: FormData) {
  return {
    unit_number: formData.get('unit_number') as string,
    vin: formData.get('vin') as string,
    year: formData.get('year') as string,
    make: formData.get('make') as string,
    model: formData.get('model') as string,
    vehicle_type: formData.get('vehicle_type') as string,
    vehicle_class: formData.get('vehicle_class') as string,
    fuel_type: formData.get('fuel_type') as string,
    status: (formData.get('status') as string) || 'active',
    license_plate: formData.get('license_plate') as string || undefined,
    license_state: formData.get('license_state') as string || undefined,
    registration_expiry: formData.get('registration_expiry') as string || undefined,
    current_odometer: formData.get('current_odometer') as string || undefined,
    avg_mpg: formData.get('avg_mpg') as string || undefined,
    purchase_date: formData.get('purchase_date') as string || undefined,
    purchase_price: formData.get('purchase_price') as string || undefined,
    current_value: formData.get('current_value') as string || undefined,
    insurance_policy: formData.get('insurance_policy') as string || undefined,
    notes: formData.get('notes') as string || undefined,
  }
}

function buildInsertData(parsed: ReturnType<typeof vehicleSchema.parse>, orgId: string) {
  return {
    org_id: orgId,
    unit_number: parsed.unit_number,
    vin: parsed.vin || null,
    year: parsed.year,
    make: parsed.make,
    model: parsed.model,
    vehicle_type: parsed.vehicle_type as VehicleType,
    vehicle_class: parsed.vehicle_class as VehicleClass,
    fuel_type: (parsed.fuel_type ?? 'diesel') as FuelType,
    status: parsed.status as VehicleStatus,
    license_plate: parsed.license_plate || null,
    license_state: parsed.license_state || null,
    registration_expiry: parsed.registration_expiry || null,
    current_odometer: parsed.current_odometer ?? null,
    odometer_updated_at: parsed.current_odometer ? new Date().toISOString() : null,
    avg_mpg: parsed.avg_mpg ?? null,
    purchase_date: parsed.purchase_date || null,
    purchase_price: parsed.purchase_price ?? null,
    current_value: parsed.current_value ?? null,
    insurance_policy: parsed.insurance_policy || null,
    notes: parsed.notes || null,
  }
}

export async function createVehicle(formData: FormData) {
  const raw = extractVehicleFields(formData)

  const parsed = vehicleSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      error: {
        form: parsed.error.issues.map((i) => i.message),
      },
    }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: { form: ['Not authenticated'] } }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) {
    return { error: { form: ['No organization found'] } }
  }

  const { error } = await supabase.from('vehicles').insert(
    buildInsertData(parsed.data, profile.org_id)
  )

  if (error) {
    return { error: { form: [error.message] } }
  }

  redirect('/fleet')
}

export async function updateVehicle(id: string, formData: FormData) {
  const raw = extractVehicleFields(formData)

  const parsed = vehicleSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      error: {
        form: parsed.error.issues.map((i) => i.message),
      },
    }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: { form: ['Not authenticated'] } }
  }

  // Check if odometer changed to update odometer_updated_at
  const { data: existing } = await supabase
    .from('vehicles')
    .select('current_odometer')
    .eq('id', id)
    .single()

  const odometerChanged =
    parsed.data.current_odometer !== undefined &&
    parsed.data.current_odometer !== existing?.current_odometer

  const { org_id: _, ...updateFields } = buildInsertData(parsed.data, '')

  const updateData: Record<string, unknown> = { ...updateFields }

  if (odometerChanged) {
    updateData.odometer_updated_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('vehicles')
    .update(updateData)
    .eq('id', id)

  if (error) {
    return { error: { form: [error.message] } }
  }

  redirect('/fleet')
}

export async function updateVehicleStatus(id: string, status: VehicleStatus) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: { form: ['Not authenticated'] } }
  }

  const updateData: Record<string, unknown> = { status }

  // If sold or totaled, unassign current driver and close open assignments
  if (status === 'sold' || status === 'totaled') {
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('current_driver_id')
      .eq('id', id)
      .single()

    updateData.current_driver_id = null

    // Clear driver's current_vehicle_id if assigned
    if (vehicle?.current_driver_id) {
      await supabase
        .from('drivers')
        .update({ current_vehicle_id: null })
        .eq('id', vehicle.current_driver_id)
    }

    // Close any open vehicle assignments
    await supabase
      .from('vehicle_assignments')
      .update({ unassigned_at: new Date().toISOString() })
      .eq('vehicle_id', id)
      .is('unassigned_at', null)
  }

  const { error } = await supabase
    .from('vehicles')
    .update(updateData)
    .eq('id', id)

  if (error) {
    return { error: { form: [error.message] } }
  }

  revalidatePath('/fleet')
}

export async function deleteVehicle(id: string) {
  // Soft delete by setting status to 'sold'
  return updateVehicleStatus(id, 'sold')
}
