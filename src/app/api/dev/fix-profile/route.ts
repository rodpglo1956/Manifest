import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// DEV ONLY: Fixes the test user's profile if org wasn't linked
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const TEST_EMAIL = 'rod@glomatrix.app'

  // Find user
  const { data: users } = await supabase.auth.admin.listUsers()
  const user = users?.users?.find(u => u.email === TEST_EMAIL)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Check profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Check if org exists
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1)

  let orgId = orgs?.[0]?.id

  // Create org if none exists
  if (!orgId) {
    const { data: newOrg } = await supabase
      .from('organizations')
      .insert({
        name: 'Glo Matrix Logistics',
        dot_number: '1234567',
        mc_number: 'MC-987654',
        company_type: 'both',
        address_line1: '123 Trucking Way',
        address_city: 'Savannah',
        address_state: 'GA',
        address_zip: '31401',
        phone: '912-555-0100',
        email: 'dispatch@glomatrix.app',
      })
      .select('id')
      .single()
    orgId = newOrg?.id
  }

  if (!orgId) return NextResponse.json({ error: 'Failed to create org' }, { status: 500 })

  // Ensure profile exists and is linked
  if (!profile) {
    await supabase.from('profiles').insert({
      id: user.id,
      org_id: orgId,
      full_name: 'Rod Patterson',
      role: 'admin',
      phone: '912-555-0100',
    })
  } else if (!profile.org_id) {
    await supabase.from('profiles').update({
      org_id: orgId,
      full_name: 'Rod Patterson',
      role: 'admin',
    }).eq('id', user.id)
  }

  // Ensure org_members
  await supabase.from('org_members').upsert({
    org_id: orgId,
    user_id: user.id,
    role: 'admin',
  }, { onConflict: 'org_id,user_id' })

  // Mark onboarding complete
  await supabase.from('onboarding_progress').upsert({
    org_id: orgId,
    step_completed: 5,
    business_profile_done: true,
    first_vehicle_done: true,
    first_driver_done: true,
    integrations_done: true,
    plan_selected: true,
    checklist_dismissed: true,
    completed_at: new Date().toISOString(),
  }, { onConflict: 'org_id' })

  // Re-read profile
  const { data: finalProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    message: 'Profile fixed',
    user_id: user.id,
    org_id: orgId,
    profile: finalProfile,
    login: { email: TEST_EMAIL, password: 'manifest2026!' },
  })
}
