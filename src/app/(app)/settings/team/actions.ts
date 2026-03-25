'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { inviteSchema } from '@/schemas/invite'
import { revalidatePath } from 'next/cache'

export async function inviteTeamMember(formData: FormData) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get profile to verify admin role and get org_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, org_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Only admins can invite users' }
  }

  if (!profile.org_id) {
    return { error: 'You must belong to an organization to invite users' }
  }

  // Validate input
  const parsed = inviteSchema.safeParse({
    email: formData.get('email'),
    role: formData.get('role'),
  })

  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join(', '),
    }
  }

  // Send invitation via Supabase admin API
  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: {
        org_id: profile.org_id,
        role: parsed.data.role,
        invited: true,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/callback?next=/dashboard`,
    }
  )

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings/team')
  return { error: null }
}
