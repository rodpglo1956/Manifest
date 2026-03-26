import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// DEV ONLY: Creates a test admin user and org, returns credentials
// Access: GET /api/dev/seed
// Remove this route before production launch

const TEST_EMAIL = 'rod@glomatrix.app'
const TEST_PASSWORD = 'manifest2026!'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!serviceRoleKey) {
    return NextResponse.json({ error: 'No service role key' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Check if test user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existing = existingUsers?.users?.find(u => u.email === TEST_EMAIL)

  if (existing) {
    return NextResponse.json({
      message: 'Test user already exists',
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      login_url: '/login',
      user_id: existing.id,
    })
  }

  // Create test user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'Rod Patterson' }
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || 'Failed to create user' }, { status: 500 })
  }

  const userId = authData.user.id

  // Create organization
  const { data: org, error: orgError } = await supabase
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

  if (orgError || !org) {
    return NextResponse.json({ error: orgError?.message || 'Failed to create org' }, { status: 500 })
  }

  // Update profile with org and admin role
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      org_id: org.id,
      full_name: 'Rod Patterson',
      role: 'admin',
      phone: '912-555-0100',
    })
    .eq('id', userId)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // Create org_members record
  await supabase
    .from('org_members')
    .insert({
      org_id: org.id,
      user_id: userId,
      role: 'admin',
    })

  // Create onboarding progress (mark as complete)
  await supabase
    .from('onboarding_progress')
    .insert({
      org_id: org.id,
      step_completed: 5,
      business_profile_done: true,
      first_vehicle_done: true,
      first_driver_done: true,
      integrations_done: true,
      plan_selected: true,
      checklist_dismissed: true,
      completed_at: new Date().toISOString(),
    })

  // Seed a test vehicle
  await supabase
    .from('vehicles')
    .insert({
      org_id: org.id,
      unit_number: 'GLO-001',
      vin: '1HGBH41JXMN109186',
      year: 2024,
      make: 'Freightliner',
      model: 'Cascadia',
      vehicle_type: 'dry_van',
      status: 'active',
    })

  // Seed a test driver
  await supabase
    .from('drivers')
    .insert({
      org_id: org.id,
      first_name: 'James',
      last_name: 'Martinez',
      phone: '912-555-0201',
      email: 'james@glomatrix.app',
      license_number: 'GA-CDL-123456',
      license_state: 'GA',
      license_class: 'A',
      status: 'active',
    })

  return NextResponse.json({
    message: 'Test account created with seed data',
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    login_url: '/login',
    user_id: userId,
    org_id: org.id,
    org_name: 'Glo Matrix Logistics',
    seeded: ['organization', 'vehicle (GLO-001)', 'driver (James Martinez)'],
  })
}
