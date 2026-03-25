'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Update driver's own phone and emergency contact info.
 * Only allows updating phone, emergency_contact_name, and emergency_contact_phone.
 */
export async function updateDriverSelf(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const phone = (formData.get('phone') as string)?.trim()
  const emergencyName = (formData.get('emergency_contact_name') as string)?.trim()
  const emergencyPhone = (formData.get('emergency_contact_phone') as string)?.trim()

  // Basic validation
  if (!phone) {
    return { error: 'Phone number is required' }
  }

  // Update only the allowed fields on the driver record linked to this user
  const { error, count } = await supabase
    .from('drivers')
    .update({
      phone,
      emergency_contact_name: emergencyName || null,
      emergency_contact_phone: emergencyPhone || null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  if (count === 0) {
    return { error: 'No driver record linked to your account' }
  }

  revalidatePath('/driver/settings')
  return {}
}
