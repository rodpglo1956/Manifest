'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { organizationSchema } from '@/schemas/organization'

export async function createOrganization(formData: FormData) {
  const raw = {
    name: formData.get('name') as string,
    address_line1: (formData.get('address_line1') as string) || '',
    address_city: (formData.get('address_city') as string) || '',
    address_state: (formData.get('address_state') as string) || '',
    address_zip: (formData.get('address_zip') as string) || '',
    phone: (formData.get('phone') as string) || '',
    email: (formData.get('email') as string) || '',
    dot_number: (formData.get('dot_number') as string) || '',
    mc_number: (formData.get('mc_number') as string) || '',
    company_type: formData.get('company_type') as string,
  }

  const parsed = organizationSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      error: {
        form: parsed.error.issues.map((i) => i.message),
      },
    }
  }

  const supabase = await createClient()

  // Verify user is authenticated
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      error: {
        form: ['You must be logged in to create an organization'],
      },
    }
  }

  // Insert organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: parsed.data.name,
      address_line1: parsed.data.address_line1 || null,
      address_city: parsed.data.address_city || null,
      address_state: parsed.data.address_state || null,
      address_zip: parsed.data.address_zip || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      dot_number: parsed.data.dot_number || null,
      mc_number: parsed.data.mc_number || null,
      company_type: parsed.data.company_type,
    })
    .select('id')
    .single()

  if (orgError || !org) {
    return {
      error: {
        form: [orgError?.message ?? 'Failed to create organization'],
      },
    }
  }

  // Update user profile with org_id and admin role
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ org_id: org.id, role: 'admin' })
    .eq('id', user.id)

  if (profileError) {
    return {
      error: {
        form: [profileError.message],
      },
    }
  }

  // Create org_members record
  const { error: memberError } = await supabase.from('org_members').insert({
    org_id: org.id,
    user_id: user.id,
    role: 'admin',
  })

  if (memberError) {
    return {
      error: {
        form: [memberError.message],
      },
    }
  }

  redirect('/dashboard')
}
