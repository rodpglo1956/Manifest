'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { complianceProfileSchema, complianceItemSchema, driverQualificationSchema, inspectionSchema } from './compliance-schemas'
import { dvirSchema } from './dvir-schema'
import { calculateNextDueDate, calculateHealthScore, calculateDQCompleteness } from './compliance-helpers'
import type {
  ComplianceProfile,
  ComplianceItem,
  ComplianceAlert,
  DriverQualification,
  Inspection,
  IFTARecord,
  ComplianceItemStatus,
  ComplianceCategory,
  InspectionType,
  InspectionResult,
} from '@/types/database'

// ---------- Profile Actions ----------

/**
 * Fetch compliance profile for current user's org.
 */
export async function getComplianceProfile(): Promise<ComplianceProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('compliance_profiles')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data as ComplianceProfile
}

/**
 * Create or update compliance profile for current user's org.
 */
export async function upsertComplianceProfile(
  formData: unknown
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = complianceProfileSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  // Check if profile exists
  const { data: existing } = await supabase
    .from('compliance_profiles')
    .select('id, org_id')
    .limit(1)
    .maybeSingle()

  // Convert undefined to null for Supabase compatibility
  const profileData = {
    carrier_type: parsed.data.carrier_type,
    is_dot_regulated: parsed.data.is_dot_regulated,
    dot_number: parsed.data.dot_number ?? null,
    mc_number: parsed.data.mc_number ?? null,
    operating_authority_status: parsed.data.operating_authority_status ?? null,
    insurance_provider: parsed.data.insurance_provider ?? null,
    insurance_policy_number: parsed.data.insurance_policy_number ?? null,
    insurance_expiry: parsed.data.insurance_expiry ?? null,
    ifta_license_number: parsed.data.ifta_license_number ?? null,
    ifta_expiry: parsed.data.ifta_expiry ?? null,
    ucr_registration_year: parsed.data.ucr_registration_year ?? null,
    ucr_expiry: parsed.data.ucr_expiry ?? null,
    drug_testing_consortium: parsed.data.drug_testing_consortium ?? null,
    drug_testing_account_id: parsed.data.drug_testing_account_id ?? null,
  }

  if (existing) {
    const { error } = await supabase
      .from('compliance_profiles')
      .update({ ...profileData, updated_at: new Date().toISOString() })
      .eq('id', existing.id)

    if (error) return { error: error.message }
  } else {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!userProfile?.org_id) return { error: 'No organization found' }

    const { error } = await supabase
      .from('compliance_profiles')
      .insert({ ...profileData, org_id: userProfile.org_id })

    if (error) return { error: error.message }
  }

  revalidatePath('/compliance')
  return {}
}

// ---------- Item Actions ----------

/**
 * List compliance items with optional filters.
 */
export async function getComplianceItems(
  filters?: { status?: string; category?: string; vehicleId?: string; driverId?: string }
): Promise<ComplianceItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('compliance_items')
    .select('*')
    .order('due_date', { ascending: true })

  if (filters?.status) {
    query = query.eq('status', filters.status as ComplianceItemStatus)
  }
  if (filters?.category) {
    query = query.eq('category', filters.category as ComplianceCategory)
  }
  if (filters?.vehicleId) {
    query = query.eq('vehicle_id', filters.vehicleId)
  }
  if (filters?.driverId) {
    query = query.eq('driver_id', filters.driverId)
  }

  const { data, error } = await query

  if (error || !data) return []
  return data as ComplianceItem[]
}

/**
 * Create a new compliance item.
 */
export async function createComplianceItem(
  formData: unknown
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = complianceItemSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  // Get profile for org_id and compliance_profile_id
  const { data: profile } = await supabase
    .from('compliance_profiles')
    .select('id, org_id')
    .limit(1)
    .single()

  if (!profile) return { error: 'No compliance profile found. Create a profile first.' }

  const { error } = await supabase
    .from('compliance_items')
    .insert({
      org_id: profile.org_id,
      compliance_profile_id: profile.id,
      category: parsed.data.category,
      title: parsed.data.title,
      status: parsed.data.status,
      alert_days_before: parsed.data.alert_days_before ?? [90, 60, 30, 14, 7, 1],
      due_date: parsed.data.due_date ?? null,
      description: parsed.data.description ?? null,
      assigned_to: parsed.data.assigned_to ?? null,
      vehicle_id: parsed.data.vehicle_id ?? null,
      driver_id: parsed.data.driver_id ?? null,
      notes: parsed.data.notes ?? null,
      recurrence_rule: parsed.data.recurrence_rule ?? null,
      recurrence_months: parsed.data.recurrence_months ?? null,
    })

  if (error) return { error: error.message }

  revalidatePath('/compliance')
  return {}
}

/**
 * Complete a compliance item. If recurring, auto-create next occurrence.
 */
export async function completeComplianceItem(
  itemId: string,
  documentUrls?: string[]
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Fetch the item
  const { data: rawItem, error: fetchError } = await supabase
    .from('compliance_items')
    .select('*')
    .eq('id', itemId)
    .single()

  if (fetchError || !rawItem) return { error: 'Item not found' }

  const item = rawItem as ComplianceItem
  const today = new Date().toISOString().split('T')[0]

  // Update to completed
  const updateData: Record<string, unknown> = {
    status: 'completed',
    completed_date: today,
    updated_at: new Date().toISOString(),
  }

  if (documentUrls && documentUrls.length > 0) {
    updateData.document_urls = documentUrls
  }

  const { error: updateError } = await supabase
    .from('compliance_items')
    .update(updateData)
    .eq('id', itemId)

  if (updateError) return { error: updateError.message }

  // If recurring, generate next occurrence
  if (item.recurrence_rule) {
    const nextDueDate = calculateNextDueDate(
      item.due_date ?? today,
      item.recurrence_rule,
      item.recurrence_months ?? undefined
    )

    // Check NOT EXISTS -- avoid duplicate next occurrence
    const { data: existing } = await supabase
      .from('compliance_items')
      .select('id')
      .eq('compliance_profile_id', item.compliance_profile_id)
      .eq('category', item.category)
      .gt('due_date', item.due_date ?? today)
      .limit(1)

    if (!existing || existing.length === 0) {
      const { error: insertError } = await supabase
        .from('compliance_items')
        .insert({
          org_id: item.org_id,
          compliance_profile_id: item.compliance_profile_id,
          category: item.category,
          title: item.title,
          description: item.description,
          due_date: nextDueDate,
          status: 'upcoming' as const,
          assigned_to: item.assigned_to,
          vehicle_id: item.vehicle_id,
          driver_id: item.driver_id,
          notes: item.notes,
          recurrence_rule: item.recurrence_rule,
          recurrence_months: item.recurrence_months,
          alert_days_before: item.alert_days_before,
        })

      if (insertError) {
        console.error('Failed to create next occurrence:', insertError.message)
      }
    }
  }

  revalidatePath('/compliance')
  return {}
}

/**
 * Update a compliance item.
 */
export async function updateComplianceItem(
  itemId: string,
  formData: unknown
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = complianceItemSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const { error } = await supabase
    .from('compliance_items')
    .update({
      category: parsed.data.category,
      title: parsed.data.title,
      status: parsed.data.status,
      due_date: parsed.data.due_date ?? null,
      description: parsed.data.description ?? null,
      assigned_to: parsed.data.assigned_to ?? null,
      vehicle_id: parsed.data.vehicle_id ?? null,
      driver_id: parsed.data.driver_id ?? null,
      notes: parsed.data.notes ?? null,
      recurrence_rule: parsed.data.recurrence_rule ?? null,
      recurrence_months: parsed.data.recurrence_months ?? null,
      alert_days_before: parsed.data.alert_days_before,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)

  if (error) return { error: error.message }

  revalidatePath('/compliance')
  return {}
}

// ---------- Driver Qualification Actions ----------

/**
 * Get DQ record for a driver with computed completeness.
 */
export async function getDriverQualification(
  driverId: string
): Promise<(DriverQualification & { completeness: { percentage: number; missing: string[] } }) | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('driver_qualifications')
    .select('*')
    .eq('driver_id', driverId)
    .maybeSingle()

  if (error || !data) return null

  const dq = data as DriverQualification
  const completeness = calculateDQCompleteness(dq)

  return { ...dq, completeness }
}

/**
 * Upsert DQ record for a driver. Computes and stores completeness.
 */
export async function upsertDriverQualification(
  driverId: string,
  formData: unknown
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = driverQualificationSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!userProfile?.org_id) return { error: 'No organization found' }

  // Build a temp DQ object to compute completeness
  const tempDq = {
    id: '', org_id: userProfile.org_id, driver_id: driverId,
    created_at: '', updated_at: '', dq_file_complete: false,
    missing_documents: null, endorsements: null, restrictions: null,
    cdl_number: null, cdl_state: null, cdl_class: null, cdl_expiry: null,
    medical_card_expiry: null, mvr_last_pulled: null, mvr_status: null,
    drug_test_last_date: null, drug_test_result: null, annual_review_date: null,
    road_test_date: null, application_date: null, hire_date: null,
    termination_date: null,
    ...parsed.data,
  } as DriverQualification

  const { percentage, missing } = calculateDQCompleteness(tempDq)

  // Check if record exists
  const { data: existing } = await supabase
    .from('driver_qualifications')
    .select('id')
    .eq('driver_id', driverId)
    .maybeSingle()

  const dqFields = {
    cdl_number: parsed.data.cdl_number ?? null,
    cdl_state: parsed.data.cdl_state ?? null,
    cdl_class: parsed.data.cdl_class ?? null,
    cdl_expiry: parsed.data.cdl_expiry ?? null,
    medical_card_expiry: parsed.data.medical_card_expiry ?? null,
    endorsements: parsed.data.endorsements ?? null,
    restrictions: parsed.data.restrictions ?? null,
    mvr_last_pulled: parsed.data.mvr_last_pulled ?? null,
    mvr_status: parsed.data.mvr_status ?? null,
    drug_test_last_date: parsed.data.drug_test_last_date ?? null,
    drug_test_result: parsed.data.drug_test_result ?? null,
    annual_review_date: parsed.data.annual_review_date ?? null,
    road_test_date: parsed.data.road_test_date ?? null,
    application_date: parsed.data.application_date ?? null,
    hire_date: parsed.data.hire_date ?? null,
    dq_file_complete: percentage === 100,
    missing_documents: missing.length > 0 ? missing : null,
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    const { error } = await supabase
      .from('driver_qualifications')
      .update(dqFields)
      .eq('id', existing.id)

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('driver_qualifications')
      .insert({
        ...dqFields,
        org_id: userProfile.org_id,
        driver_id: driverId,
        termination_date: null,
      })

    if (error) return { error: error.message }
  }

  revalidatePath('/compliance/drivers')
  return {}
}

/**
 * List all active drivers with DQ status.
 */
export async function getDriversWithDQStatus(): Promise<
  Array<{
    id: string
    first_name: string
    last_name: string
    completeness: number
    missingCount: number
    cdl_expiry: string | null
    medical_card_expiry: string | null
  }>
> {
  const supabase = await createClient()

  const { data: drivers, error: driverError } = await supabase
    .from('drivers')
    .select('id, first_name, last_name')
    .eq('status', 'active')
    .order('last_name')

  if (driverError || !drivers) return []

  const { data: dqs } = await supabase
    .from('driver_qualifications')
    .select('*')

  const dqMap = new Map<string, DriverQualification>()
  if (dqs) {
    for (const dq of dqs) {
      dqMap.set((dq as DriverQualification).driver_id, dq as DriverQualification)
    }
  }

  return drivers.map((d) => {
    const dq = dqMap.get(d.id)
    if (dq) {
      const { percentage, missing: missingList } = calculateDQCompleteness(dq)
      return {
        ...d,
        completeness: percentage,
        missingCount: missingList.length,
        cdl_expiry: dq.cdl_expiry,
        medical_card_expiry: dq.medical_card_expiry,
      }
    }
    return { ...d, completeness: 0, missingCount: 8, cdl_expiry: null, medical_card_expiry: null }
  })
}

// ---------- Inspection Actions ----------

/**
 * Create an inspection record.
 */
export async function createInspection(
  formData: unknown
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = inspectionSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!userProfile?.org_id) return { error: 'No organization found' }

  const { error } = await supabase
    .from('inspections')
    .insert({
      org_id: userProfile.org_id,
      vehicle_id: parsed.data.vehicle_id,
      inspection_type: parsed.data.inspection_type,
      inspection_date: parsed.data.inspection_date,
      inspector_name: parsed.data.inspector_name ?? null,
      expiry_date: parsed.data.expiry_date ?? null,
      result: parsed.data.result ?? null,
      defects_found: parsed.data.defects_found ?? null,
      defects_corrected: parsed.data.defects_corrected ?? null,
      notes: parsed.data.notes ?? null,
    })

  if (error) return { error: error.message }

  revalidatePath('/compliance/inspections')
  return {}
}

/**
 * List inspections with optional filters.
 */
export async function getInspections(
  filters?: { vehicleId?: string; type?: string; result?: string }
): Promise<Inspection[]> {
  const supabase = await createClient()

  let query = supabase
    .from('inspections')
    .select('*')
    .order('inspection_date', { ascending: false })

  if (filters?.vehicleId) {
    query = query.eq('vehicle_id', filters.vehicleId)
  }
  if (filters?.type) {
    query = query.eq('inspection_type', filters.type as InspectionType)
  }
  if (filters?.result) {
    query = query.eq('result', filters.result as InspectionResult)
  }

  const { data, error } = await query

  if (error || !data) return []
  return data as Inspection[]
}

/**
 * Submit a DVIR (Driver Vehicle Inspection Report).
 * Parses DVIR form, determines result, creates inspection record.
 */
export async function submitDVIR(
  formData: unknown
): Promise<{ data?: Inspection; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = dvirSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const dvir = parsed.data

  // Determine result
  const failedItems = Object.entries(dvir.items)
    .filter(([, v]) => v === 'fail')
    .map(([k]) => k)

  let result: 'pass' | 'fail' | 'conditional'
  if (failedItems.length === 0) {
    result = 'pass'
  } else {
    const defectItemIds = new Set(dvir.defects.map((d) => d.item_id))
    const allFailsCovered = failedItems.every((id) => defectItemIds.has(id))
    result = allFailsCovered ? 'conditional' : 'fail'
  }

  // Extract defect descriptions
  const defectsFound = dvir.defects.map(
    (d) => `${d.item_id}: ${d.description}`
  )

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('org_id, full_name')
    .eq('id', user.id)
    .single()

  if (!userProfile?.org_id) return { error: 'No organization found' }

  const today = new Date().toISOString().split('T')[0]

  const { data: inspection, error } = await supabase
    .from('inspections')
    .insert({
      org_id: userProfile.org_id,
      vehicle_id: dvir.vehicle_id,
      inspection_type: dvir.inspection_type,
      inspector_name: userProfile.full_name,
      inspection_date: today,
      result,
      defects_found: defectsFound.length > 0 ? defectsFound : null,
      notes: dvir.notes ?? null,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/driver/compliance')
  return { data: inspection as Inspection }
}

// ---------- IFTA Actions ----------

/**
 * Get IFTA records for a quarter. Defaults to current quarter.
 */
export async function getIFTARecords(
  quarter?: string
): Promise<IFTARecord[]> {
  const supabase = await createClient()

  const targetQuarter = quarter ?? getCurrentQuarter()

  const { data, error } = await supabase
    .from('ifta_records')
    .select('*')
    .eq('quarter', targetQuarter)
    .order('jurisdiction')

  if (error || !data) return []
  return data as IFTARecord[]
}

/**
 * Insert or update IFTA record by vehicle_id + quarter + jurisdiction.
 */
export async function upsertIFTARecord(
  formData: unknown
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const data = formData as {
    vehicle_id: string
    quarter: string
    jurisdiction: string
    miles_traveled?: number
    gallons_purchased?: number
    tax_rate?: number
    tax_owed?: number
    tax_paid?: number
    net_tax?: number
  }

  if (!data.vehicle_id || !data.quarter || !data.jurisdiction) {
    return { error: 'vehicle_id, quarter, and jurisdiction are required' }
  }

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!userProfile?.org_id) return { error: 'No organization found' }

  // Check if record exists for this composite key
  const { data: existing } = await supabase
    .from('ifta_records')
    .select('id')
    .eq('vehicle_id', data.vehicle_id)
    .eq('quarter', data.quarter)
    .eq('jurisdiction', data.jurisdiction)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('ifta_records')
      .update({
        miles_traveled: data.miles_traveled ?? 0,
        gallons_purchased: data.gallons_purchased ?? 0,
        tax_rate: data.tax_rate ?? null,
        tax_owed: data.tax_owed ?? null,
        tax_paid: data.tax_paid ?? null,
        net_tax: data.net_tax ?? null,
      })
      .eq('id', existing.id)

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('ifta_records')
      .insert({
        org_id: userProfile.org_id,
        vehicle_id: data.vehicle_id,
        quarter: data.quarter,
        jurisdiction: data.jurisdiction,
        miles_traveled: data.miles_traveled ?? 0,
        gallons_purchased: data.gallons_purchased ?? 0,
        tax_rate: data.tax_rate ?? null,
        tax_owed: data.tax_owed ?? null,
        tax_paid: data.tax_paid ?? null,
        net_tax: data.net_tax ?? null,
        source: 'manual',
      })

    if (error) return { error: error.message }
  }

  revalidatePath('/compliance/ifta')
  return {}
}

// ---------- Dashboard Action ----------

/**
 * Fetch all compliance dashboard data: health score, metrics, recent alerts, upcoming items.
 */
export async function getComplianceDashboard(): Promise<{
  healthScore: number
  metrics: {
    totalItems: number
    overdueItems: number
    dueSoonItems: number
    totalDrivers: number
    driversWithCompleteDQ: number
    totalVehicles: number
    vehiclesWithCurrentInspection: number
  }
  recentAlerts: ComplianceAlert[]
  upcomingItems: ComplianceItem[]
}> {
  const supabase = await createClient()

  // Fetch compliance items counts
  const { data: items } = await supabase
    .from('compliance_items')
    .select('status')
    .not('status', 'in', '("completed","waived","not_applicable")')

  const totalItems = items?.length ?? 0
  const overdueItems = items?.filter((i) => i.status === 'overdue').length ?? 0
  const dueSoonItems = items?.filter((i) => i.status === 'due_soon').length ?? 0

  // Fetch drivers with DQ status
  const { data: drivers } = await supabase
    .from('drivers')
    .select('id')
    .eq('status', 'active')

  const totalDrivers = drivers?.length ?? 0

  const { data: dqs } = await supabase
    .from('driver_qualifications')
    .select('*')
    .eq('dq_file_complete', true)

  const driversWithCompleteDQ = dqs?.length ?? 0

  // Fetch vehicles with current annual inspection
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id')
    .eq('status', 'active')

  const totalVehicles = vehicles?.length ?? 0

  const today = new Date().toISOString().split('T')[0]
  const { data: currentInspections } = await supabase
    .from('inspections')
    .select('vehicle_id')
    .eq('inspection_type', 'annual_dot' as InspectionType)
    .gte('expiry_date', today)

  const vehicleIds = new Set(currentInspections?.map((i) => i.vehicle_id) ?? [])
  const vehiclesWithCurrentInspection = vehicleIds.size

  const metrics = {
    totalItems,
    overdueItems,
    dueSoonItems,
    totalDrivers,
    driversWithCompleteDQ,
    totalVehicles,
    vehiclesWithCurrentInspection,
  }

  const healthScore = calculateHealthScore(metrics)

  // Recent unacknowledged compliance alerts (last 10)
  const { data: recentAlerts } = await supabase
    .from('compliance_alerts')
    .select('*')
    .eq('acknowledged', false)
    .order('created_at', { ascending: false })
    .limit(10)

  // Upcoming items (next 90 days)
  const ninetyDaysFromNow = new Date()
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)
  const futureDate = ninetyDaysFromNow.toISOString().split('T')[0]

  const { data: upcomingItems } = await supabase
    .from('compliance_items')
    .select('*')
    .not('status', 'in', '("completed","waived","not_applicable")')
    .lte('due_date', futureDate)
    .order('due_date', { ascending: true })

  return {
    healthScore,
    metrics,
    recentAlerts: (recentAlerts ?? []) as ComplianceAlert[],
    upcomingItems: (upcomingItems ?? []) as ComplianceItem[],
  }
}

// ---------- Alert Actions ----------

/**
 * Acknowledge a compliance alert.
 */
export async function acknowledgeComplianceAlert(
  alertId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('compliance_alerts')
    .update({
      acknowledged: true,
      acknowledged_by: user.id,
      acknowledged_at: new Date().toISOString(),
    })
    .eq('id', alertId)

  if (error) return { error: error.message }

  revalidatePath('/compliance')
  return {}
}

// ---------- Helpers ----------

function getCurrentQuarter(): string {
  const now = new Date()
  const q = Math.ceil((now.getMonth() + 1) / 3)
  return `${now.getFullYear()}-Q${q}`
}
