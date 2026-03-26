'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function markDriverOnboarded(driverId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify the driver record belongs to this user
  const { data: driver } = await supabase
    .from('drivers')
    .select('id, user_id')
    .eq('id', driverId)
    .eq('user_id', user.id)
    .single()

  if (!driver) return { error: 'Driver not found' }

  const { error } = await supabase
    .from('drivers')
    .update({ is_onboarded: true })
    .eq('id', driverId)

  if (error) return { error: error.message }

  revalidatePath('/driver')
  return { success: true }
}
