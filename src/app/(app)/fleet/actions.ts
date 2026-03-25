'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { vehicleSchema } from '@/schemas/vehicle'
import type { VehicleStatus, VehicleType } from '@/types/database'

export async function createVehicle(formData: FormData) {
  const raw = {
    unit_number: formData.get('unit_number') as string,
    vin: formData.get('vin') as string,
    year: formData.get('year') as string,
    make: formData.get('make') as string,
    model: formData.get('model') as string,
    vehicle_type: formData.get('vehicle_type') as string,
    status: (formData.get('status') as string) || 'active',
  }

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

  const { error } = await supabase.from('vehicles').insert({
    org_id: profile.org_id,
    unit_number: parsed.data.unit_number,
    vin: parsed.data.vin || null,
    year: parsed.data.year,
    make: parsed.data.make,
    model: parsed.data.model,
    vehicle_type: parsed.data.vehicle_type as VehicleType,
    status: parsed.data.status as VehicleStatus,
  })

  if (error) {
    return { error: { form: [error.message] } }
  }

  redirect('/fleet')
}

export async function updateVehicle(id: string, formData: FormData) {
  const raw = {
    unit_number: formData.get('unit_number') as string,
    vin: formData.get('vin') as string,
    year: formData.get('year') as string,
    make: formData.get('make') as string,
    model: formData.get('model') as string,
    vehicle_type: formData.get('vehicle_type') as string,
    status: formData.get('status') as string,
  }

  const parsed = vehicleSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      error: {
        form: parsed.error.issues.map((i) => i.message),
      },
    }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('vehicles')
    .update({
      unit_number: parsed.data.unit_number,
      vin: parsed.data.vin || null,
      year: parsed.data.year,
      make: parsed.data.make,
      model: parsed.data.model,
      vehicle_type: parsed.data.vehicle_type as VehicleType,
      status: parsed.data.status as VehicleStatus,
    })
    .eq('id', id)

  if (error) {
    return { error: { form: [error.message] } }
  }

  redirect('/fleet')
}
