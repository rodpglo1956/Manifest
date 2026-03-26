'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  businessProfileSchema,
  firstVehicleSchema,
  firstDriverSchema,
  integrationsSchema,
  planSelectionSchema,
} from '@/lib/onboarding/schemas'
import type { OnboardingProgress } from '@/types/database'

// ============================================================
// Auth + Org helper (per Phase 8 getAuthContext pattern)
// ============================================================

async function getAuthContext() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' as const, supabase, user: null, orgId: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) {
    return { error: 'No organization found' as const, supabase, user, orgId: null }
  }

  return { error: null, supabase, user, orgId: profile.org_id }
}

// ============================================================
// Get onboarding progress
// ============================================================

export async function getOnboardingProgress(): Promise<OnboardingProgress | null> {
  const { error, supabase, orgId } = await getAuthContext()
  if (error || !orgId) return null

  const { data } = await supabase
    .from('onboarding_progress')
    .select('*')
    .eq('org_id', orgId)
    .single()

  return (data as OnboardingProgress) ?? null
}

// ============================================================
// Step 1: Business Profile
// ============================================================

export async function saveBusinessProfile(formData: unknown) {
  const { error: authError, supabase, orgId } = await getAuthContext()
  if (authError || !orgId) return { error: authError ?? 'No org' }

  const parsed = businessProfileSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues.map(i => i.message).join(', ') }
  }

  const data = parsed.data

  // Update organization fields
  const { error: orgError } = await supabase
    .from('organizations')
    .update({
      name: data.company_name,
      address_line1: data.address_line1 || null,
      address_city: data.address_city || null,
      address_state: data.address_state || null,
      address_zip: data.address_zip || null,
      dot_number: data.dot_number || null,
    })
    .eq('id', orgId)

  if (orgError) return { error: orgError.message }

  // Update onboarding progress
  const { error: progressError } = await supabase
    .from('onboarding_progress')
    .update({
      business_profile_done: true,
      step_completed: 1,
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)

  if (progressError) return { error: progressError.message }

  revalidatePath('/onboarding')
  return { success: true }
}

// ============================================================
// Step 2: First Vehicle
// ============================================================

export async function saveFirstVehicle(formData: unknown) {
  const { error: authError, supabase, orgId } = await getAuthContext()
  if (authError || !orgId) return { error: authError ?? 'No org' }

  const parsed = firstVehicleSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues.map(i => i.message).join(', ') }
  }

  const data = parsed.data

  // Insert vehicle record
  const { error: vehicleError } = await supabase
    .from('vehicles')
    .insert({
      org_id: orgId,
      unit_number: data.unit_number,
      year: data.year,
      make: data.make,
      model: data.model,
      vin: data.vin || null,
      vehicle_type: 'dry_van' as const,
      status: 'active' as const,
    })

  if (vehicleError) return { error: vehicleError.message }

  // Update onboarding progress
  const { error: progressError } = await supabase
    .from('onboarding_progress')
    .update({
      first_vehicle_done: true,
      step_completed: 2,
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)

  if (progressError) return { error: progressError.message }

  revalidatePath('/onboarding')
  return { success: true }
}

// ============================================================
// Step 3: First Driver
// ============================================================

export async function saveFirstDriver(formData: unknown) {
  const { error: authError, supabase, orgId } = await getAuthContext()
  if (authError || !orgId) return { error: authError ?? 'No org' }

  const parsed = firstDriverSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues.map(i => i.message).join(', ') }
  }

  const data = parsed.data

  // Insert driver record
  const { error: driverError } = await supabase
    .from('drivers')
    .insert({
      org_id: orgId,
      first_name: data.first_name,
      last_name: data.last_name,
      license_number: data.cdl_number || null,
      phone: data.phone || null,
      email: data.email || null,
      status: 'active' as const,
    })

  if (driverError) return { error: driverError.message }

  // Update onboarding progress
  const { error: progressError } = await supabase
    .from('onboarding_progress')
    .update({
      first_driver_done: true,
      step_completed: 3,
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)

  if (progressError) return { error: progressError.message }

  revalidatePath('/onboarding')
  return { success: true }
}

// ============================================================
// Step 3 (OO): Skip first driver
// ============================================================

export async function skipFirstDriver() {
  const { error: authError, supabase, orgId } = await getAuthContext()
  if (authError || !orgId) return { error: authError ?? 'No org' }

  const { error: progressError } = await supabase
    .from('onboarding_progress')
    .update({
      first_driver_done: true,
      step_completed: 3,
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)

  if (progressError) return { error: progressError.message }

  revalidatePath('/onboarding')
  return { success: true }
}

// ============================================================
// Step 4: Integrations (placeholder)
// ============================================================

export async function saveIntegrations(formData: unknown) {
  const { error: authError, supabase, orgId } = await getAuthContext()
  if (authError || !orgId) return { error: authError ?? 'No org' }

  // Validate but we just mark done -- integrations are placeholder
  integrationsSchema.safeParse(formData)

  const { error: progressError } = await supabase
    .from('onboarding_progress')
    .update({
      integrations_done: true,
      step_completed: 4,
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)

  if (progressError) return { error: progressError.message }

  revalidatePath('/onboarding')
  return { success: true }
}

// ============================================================
// Step 5: Plan Selection
// ============================================================

export async function savePlanSelection(formData: unknown) {
  const { error: authError, supabase, orgId } = await getAuthContext()
  if (authError || !orgId) return { error: authError ?? 'No org' }

  const parsed = planSelectionSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues.map(i => i.message).join(', ') }
  }

  // Update billing account plan if it exists
  await supabase
    .from('billing_accounts')
    .update({ plan: parsed.data.plan })
    .eq('org_id', orgId)

  // Update onboarding progress
  const { error: progressError } = await supabase
    .from('onboarding_progress')
    .update({
      plan_selected: true,
      step_completed: 5,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)

  if (progressError) return { error: progressError.message }

  revalidatePath('/onboarding')
  return { success: true }
}

// ============================================================
// Getting Started checklist
// ============================================================

export type ChecklistItem = {
  label: string
  completed: boolean
  href: string
}

export async function getChecklistStatus(): Promise<{
  items: ChecklistItem[]
  dismissed: boolean
} | null> {
  const { error, supabase, orgId } = await getAuthContext()
  if (error || !orgId) return null

  // Check onboarding progress for dismissed state
  const { data: progress } = await supabase
    .from('onboarding_progress')
    .select('checklist_dismissed')
    .eq('org_id', orgId)
    .single()

  if (!progress) return null

  // Detect OO
  const { count: memberCount } = await supabase
    .from('org_members')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)

  const isOO = (memberCount ?? 0) === 1

  // Query counts in parallel
  const [vehiclesResult, driversResult, loadsResult, complianceResult, membersResult] =
    await Promise.all([
      supabase
        .from('vehicles')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId),
      supabase
        .from('drivers')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId),
      supabase
        .from('loads')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('compliance_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId),
      supabase
        .from('org_members')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId),
    ])

  const items: ChecklistItem[] = [
    {
      label: 'Add a vehicle',
      completed: (vehiclesResult.count ?? 0) > 0,
      href: '/fleet',
    },
  ]

  // Skip driver and invite items for owner-operators
  if (!isOO) {
    items.push({
      label: 'Add a driver',
      completed: (driversResult.count ?? 0) > 0,
      href: '/drivers',
    })
  }

  items.push(
    {
      label: 'Create first load',
      completed: (loadsResult.count ?? 0) > 0,
      href: '/loads/new',
    },
    {
      label: 'Set up compliance profile',
      completed: (complianceResult.count ?? 0) > 0,
      href: '/compliance',
    },
  )

  if (!isOO) {
    items.push({
      label: 'Invite a team member',
      completed: (membersResult.count ?? 0) > 1,
      href: '/settings/team',
    })
  }

  return {
    items,
    dismissed: progress.checklist_dismissed,
  }
}

export async function dismissChecklist() {
  const { error: authError, supabase, orgId } = await getAuthContext()
  if (authError || !orgId) return { error: authError ?? 'No org' }

  const { error: updateError } = await supabase
    .from('onboarding_progress')
    .update({
      checklist_dismissed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/dashboard')
  return { success: true }
}

// ============================================================
// Complete onboarding -- redirect to dashboard
// ============================================================

export async function completeOnboarding() {
  const { error: authError, supabase, orgId } = await getAuthContext()
  if (authError || !orgId) return { error: authError ?? 'No org' }

  // Ensure completed_at is set
  await supabase
    .from('onboarding_progress')
    .update({
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)

  redirect('/dashboard')
}
