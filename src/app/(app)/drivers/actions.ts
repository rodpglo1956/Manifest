'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { driverSchema } from '@/schemas/driver'
import type { DriverStatus } from '@/types/database'

export async function createDriver(formData: FormData) {
  const raw = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    license_number: formData.get('license_number') as string,
    license_state: formData.get('license_state') as string,
    license_class: formData.get('license_class') as string || undefined,
    license_expiration: formData.get('license_expiration') as string,
    hire_date: formData.get('hire_date') as string,
    status: (formData.get('status') as string) || 'active',
    home_terminal: formData.get('home_terminal') as string,
    notes: formData.get('notes') as string,
    emergency_contact_name: formData.get('emergency_contact_name') as string,
    emergency_contact_phone: formData.get('emergency_contact_phone') as string,
  }

  const parsed = driverSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      error: {
        form: parsed.error.issues.map((i) => i.message),
      },
    }
  }

  const supabase = await createClient()

  // Get current user's org_id from their profile
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

  const { error } = await supabase.from('drivers').insert({
    org_id: profile.org_id,
    user_id: null,
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
    email: parsed.data.email || null,
    phone: parsed.data.phone,
    license_number: parsed.data.license_number || null,
    license_state: parsed.data.license_state || null,
    license_class: parsed.data.license_class || null,
    license_expiration: parsed.data.license_expiration || null,
    hire_date: parsed.data.hire_date || null,
    status: parsed.data.status as DriverStatus,
    current_vehicle_id: null,
    home_terminal: parsed.data.home_terminal || null,
    notes: parsed.data.notes || null,
    emergency_contact_name: parsed.data.emergency_contact_name || null,
    emergency_contact_phone: parsed.data.emergency_contact_phone || null,
  })

  if (error) {
    return { error: { form: [error.message] } }
  }

  redirect('/drivers')
}

export async function updateDriver(id: string, formData: FormData) {
  const raw = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    license_number: formData.get('license_number') as string,
    license_state: formData.get('license_state') as string,
    license_class: formData.get('license_class') as string || undefined,
    license_expiration: formData.get('license_expiration') as string,
    hire_date: formData.get('hire_date') as string,
    status: formData.get('status') as string,
    home_terminal: formData.get('home_terminal') as string,
    notes: formData.get('notes') as string,
    emergency_contact_name: formData.get('emergency_contact_name') as string,
    emergency_contact_phone: formData.get('emergency_contact_phone') as string,
  }

  const parsed = driverSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      error: {
        form: parsed.error.issues.map((i) => i.message),
      },
    }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('drivers')
    .update({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      email: parsed.data.email || null,
      phone: parsed.data.phone,
      license_number: parsed.data.license_number || null,
      license_state: parsed.data.license_state || null,
      license_class: parsed.data.license_class || null,
      license_expiration: parsed.data.license_expiration || null,
      hire_date: parsed.data.hire_date || null,
      status: parsed.data.status as DriverStatus,
      home_terminal: parsed.data.home_terminal || null,
      notes: parsed.data.notes || null,
      emergency_contact_name: parsed.data.emergency_contact_name || null,
      emergency_contact_phone: parsed.data.emergency_contact_phone || null,
    })
    .eq('id', id)

  if (error) {
    return { error: { form: [error.message] } }
  }

  redirect(`/drivers/${id}`)
}

export async function deactivateDriver(id: string, status: 'inactive' | 'terminated') {
  const supabase = await createClient()

  const { error } = await supabase
    .from('drivers')
    .update({ status })
    .eq('id', id)

  if (error) {
    return { error: { form: [error.message] } }
  }

  revalidatePath('/drivers')
  revalidatePath(`/drivers/${id}`)

  return { success: true }
}
