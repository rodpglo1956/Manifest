'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { driverSchema } from '@/schemas/driver'
import { checkUsageLimit, UsageLimitError } from '@/lib/billing/enforce'
import type { Driver, DriverStatus } from '@/types/database'

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

  // Check plan limits before creating driver
  try {
    await checkUsageLimit(profile.org_id, 'drivers')
  } catch (err) {
    if (err instanceof UsageLimitError) {
      return { error: { form: ['Driver limit reached. Upgrade your plan to add more drivers.'] } }
    }
    throw err
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

/**
 * Link a driver record to a user account by sending an invitation email.
 * Uses Supabase admin API to invite user with driver role metadata.
 */
export async function linkDriverToUser(
  driverId: string,
  email: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Get current user and verify they are admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, org_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Only admins can link drivers to user accounts' }
  }

  if (!profile.org_id) {
    return { error: 'No organization found' }
  }

  // Check if driver already has a user_id
  const { data: driver } = await supabase
    .from('drivers')
    .select('id, user_id, org_id, first_name, last_name')
    .eq('id', driverId)
    .single() as { data: Driver | null }

  if (!driver) {
    return { error: 'Driver not found' }
  }

  if (driver.user_id) {
    return { error: 'This driver is already linked to a user account' }
  }

  // Validate email
  const trimmedEmail = email.trim().toLowerCase()
  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    return { error: 'Please provide a valid email address' }
  }

  // Send invitation via Supabase admin API
  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    trimmedEmail,
    {
      data: {
        org_id: driver.org_id,
        role: 'driver',
        invited: true,
        driver_id: driverId,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/callback?next=/driver/dashboard`,
    }
  )

  if (inviteError) {
    return { error: inviteError.message }
  }

  // Link the invited user to the driver record
  if (inviteData?.user?.id) {
    const { error: updateError } = await supabase
      .from('drivers')
      .update({ user_id: inviteData.user.id, email: trimmedEmail })
      .eq('id', driverId)

    if (updateError) {
      return { error: `Invitation sent but failed to link: ${updateError.message}` }
    }
  }

  revalidatePath(`/drivers/${driverId}`)
  return {}
}
