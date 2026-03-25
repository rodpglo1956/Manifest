'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  companySchema,
  contactSchema,
  laneSchema,
  rateAgreementSchema,
  activitySchema,
} from '@/lib/crm/schemas'
import type { CompanyInput, ContactInput, LaneInput, RateAgreementInput, ActivityInput } from '@/lib/crm/schemas'
import type {
  CrmCompanyType,
  CrmCompanyStatus,
  CrmLaneStatus,
  CrmAgreementStatus,
  CrmActivityType,
  CrmCompany,
  CrmContact,
  CrmLane,
  CrmLaneCompany,
  CrmRateAgreement,
  CrmActivity,
} from '@/types/database'

// ============================================================
// Auth + Org helper (same pattern as fleet/actions.ts)
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
// Company actions
// ============================================================

export async function getCompanies(filters?: {
  type?: CrmCompanyType
  status?: CrmCompanyStatus
  search?: string
}) {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  let query = supabase
    .from('crm_companies')
    .select('*')
    .eq('org_id', orgId!)
    .order('name')

  if (filters?.type) {
    query = query.eq('company_type', filters.type)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,mc_number.ilike.%${filters.search}%,dot_number.ilike.%${filters.search}%`
    )
  }

  const { data: rawData, error: dbError } = await query
  if (dbError) return { error: { form: [dbError.message] }, data: null }

  return { error: null, data: (rawData ?? []) as CrmCompany[] }
}

export async function createCompany(input: CompanyInput) {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  const parsed = companySchema.safeParse(input)
  if (!parsed.success) {
    return { error: { form: parsed.error.issues.map(i => i.message) }, data: null }
  }

  const v = parsed.data
  const { data, error: dbError } = await supabase
    .from('crm_companies')
    .insert({
      org_id: orgId!,
      name: v.name,
      company_type: v.company_type,
      mc_number: v.mc_number || null,
      dot_number: v.dot_number || null,
      credit_score: v.credit_score ?? null,
      days_to_pay: v.days_to_pay ?? null,
      payment_terms: v.payment_terms || null,
      factoring_company: v.factoring_company || null,
      primary_contact_name: v.primary_contact_name || null,
      primary_contact_email: v.primary_contact_email || null,
      primary_contact_phone: v.primary_contact_phone || null,
      address_line1: v.address_line1 || null,
      address_line2: v.address_line2 || null,
      city: v.city || null,
      state: v.state || null,
      zip: v.zip || null,
      website: v.website || null,
      notes: v.notes || null,
      status: v.status,
      tags: v.tags,
    })
    .select()
    .single()

  if (dbError) return { error: { form: [dbError.message] }, data: null }

  revalidatePath('/crm')
  return { error: null, data }
}

export async function updateCompany(id: string, input: Partial<CompanyInput>) {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  const parsed = companySchema.partial().safeParse(input)
  if (!parsed.success) {
    return { error: { form: parsed.error.issues.map(i => i.message) }, data: null }
  }

  const v = parsed.data
  const updateData: Record<string, unknown> = {}
  if (v.name !== undefined) updateData.name = v.name
  if (v.company_type !== undefined) updateData.company_type = v.company_type
  if (v.mc_number !== undefined) updateData.mc_number = v.mc_number || null
  if (v.dot_number !== undefined) updateData.dot_number = v.dot_number || null
  if (v.credit_score !== undefined) updateData.credit_score = v.credit_score ?? null
  if (v.days_to_pay !== undefined) updateData.days_to_pay = v.days_to_pay ?? null
  if (v.payment_terms !== undefined) updateData.payment_terms = v.payment_terms || null
  if (v.factoring_company !== undefined) updateData.factoring_company = v.factoring_company || null
  if (v.primary_contact_name !== undefined) updateData.primary_contact_name = v.primary_contact_name || null
  if (v.primary_contact_email !== undefined) updateData.primary_contact_email = v.primary_contact_email || null
  if (v.primary_contact_phone !== undefined) updateData.primary_contact_phone = v.primary_contact_phone || null
  if (v.address_line1 !== undefined) updateData.address_line1 = v.address_line1 || null
  if (v.address_line2 !== undefined) updateData.address_line2 = v.address_line2 || null
  if (v.city !== undefined) updateData.city = v.city || null
  if (v.state !== undefined) updateData.state = v.state || null
  if (v.zip !== undefined) updateData.zip = v.zip || null
  if (v.website !== undefined) updateData.website = v.website || null
  if (v.notes !== undefined) updateData.notes = v.notes || null
  if (v.status !== undefined) updateData.status = v.status
  if (v.tags !== undefined) updateData.tags = v.tags

  const { data, error: dbError } = await supabase
    .from('crm_companies')
    .update(updateData)
    .eq('id', id)
    .eq('org_id', orgId!)
    .select()
    .single()

  if (dbError) return { error: { form: [dbError.message] }, data: null }

  revalidatePath('/crm')
  return { error: null, data }
}

export async function getCompanyDetail(id: string) {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  // Fetch company
  const { data: company, error: companyError } = await supabase
    .from('crm_companies')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId!)
    .single()

  if (companyError) return { error: { form: [companyError.message] }, data: null }

  // Fetch contacts
  const { data: contacts } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('company_id', id)
    .order('is_primary', { ascending: false })
    .order('last_name')

  // Fetch lane associations via junction table
  const { data: rawLc } = await supabase
    .from('crm_lane_companies')
    .select('*')
    .eq('company_id', id)
  const laneCompanies = (rawLc ?? []) as CrmLaneCompany[]

  // Fetch full lane records for matched IDs
  const laneIds = laneCompanies.map(lc => lc.lane_id)
  let lanes: Array<Record<string, unknown>> = []
  if (laneIds.length > 0) {
    const { data: rawLanes } = await supabase
      .from('crm_lanes')
      .select('*')
      .in('id', laneIds)
    const laneRows = (rawLanes ?? []) as CrmLane[]

    const lcMap = new Map(laneCompanies.map(lc => [lc.lane_id, lc]))
    lanes = laneRows.map(lane => ({
      ...lane,
      relationship: lcMap.get(lane.id)?.relationship ?? null,
      contracted_rate: lcMap.get(lane.id)?.contracted_rate ?? null,
    }))
  }

  // Fetch rate agreements
  const { data: rateAgreements } = await supabase
    .from('crm_rate_agreements')
    .select('*')
    .eq('company_id', id)
    .order('effective_date', { ascending: false })

  // Fetch recent activities (last 20)
  const { data: activities } = await supabase
    .from('crm_activities')
    .select('*')
    .eq('company_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  return {
    error: null,
    data: {
      ...company,
      contacts: contacts ?? [],
      lanes,
      rateAgreements: rateAgreements ?? [],
      activities: activities ?? [],
    },
  }
}

// ============================================================
// Contact actions
// ============================================================

export async function getContacts(companyId?: string) {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  let query = supabase
    .from('crm_contacts')
    .select('*')
    .eq('org_id', orgId!)
    .order('last_name')

  if (companyId) {
    query = query.eq('company_id', companyId)
  }

  const { data, error: dbError } = await query
  if (dbError) return { error: { form: [dbError.message] }, data: null }

  return { error: null, data }
}

export async function createContact(input: ContactInput) {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  const parsed = contactSchema.safeParse(input)
  if (!parsed.success) {
    return { error: { form: parsed.error.issues.map(i => i.message) }, data: null }
  }

  const v = parsed.data

  // If is_primary=true, clear primary flag on other contacts for same company
  if (v.is_primary) {
    await supabase
      .from('crm_contacts')
      .update({ is_primary: false })
      .eq('company_id', v.company_id)
      .eq('org_id', orgId!)
  }

  const { data, error: dbError } = await supabase
    .from('crm_contacts')
    .insert({
      org_id: orgId!,
      company_id: v.company_id,
      first_name: v.first_name,
      last_name: v.last_name,
      title: v.title || null,
      email: v.email || null,
      phone: v.phone || null,
      is_primary: v.is_primary,
      notes: v.notes || null,
    })
    .select()
    .single()

  if (dbError) return { error: { form: [dbError.message] }, data: null }

  revalidatePath('/crm')
  return { error: null, data }
}

export async function updateContact(id: string, input: Partial<ContactInput>) {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  const parsed = contactSchema.partial().safeParse(input)
  if (!parsed.success) {
    return { error: { form: parsed.error.issues.map(i => i.message) }, data: null }
  }

  const v = parsed.data

  // Handle is_primary toggle: clear others if setting to true
  if (v.is_primary === true && v.company_id) {
    await supabase
      .from('crm_contacts')
      .update({ is_primary: false })
      .eq('company_id', v.company_id)
      .eq('org_id', orgId!)
  }

  const updateData: Record<string, unknown> = {}
  if (v.first_name !== undefined) updateData.first_name = v.first_name
  if (v.last_name !== undefined) updateData.last_name = v.last_name
  if (v.company_id !== undefined) updateData.company_id = v.company_id
  if (v.title !== undefined) updateData.title = v.title || null
  if (v.email !== undefined) updateData.email = v.email || null
  if (v.phone !== undefined) updateData.phone = v.phone || null
  if (v.is_primary !== undefined) updateData.is_primary = v.is_primary
  if (v.notes !== undefined) updateData.notes = v.notes || null

  const { data, error: dbError } = await supabase
    .from('crm_contacts')
    .update(updateData)
    .eq('id', id)
    .eq('org_id', orgId!)
    .select()
    .single()

  if (dbError) return { error: { form: [dbError.message] }, data: null }

  revalidatePath('/crm')
  return { error: null, data }
}

// ============================================================
// Lane actions
// ============================================================

export async function getLanes(filters?: {
  status?: CrmLaneStatus
  search?: string
}) {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  let query = supabase
    .from('crm_lanes')
    .select('*')
    .eq('org_id', orgId!)
    .order('origin_city')

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.search) {
    query = query.or(
      `origin_city.ilike.%${filters.search}%,destination_city.ilike.%${filters.search}%`
    )
  }

  const { data, error: dbError } = await query
  if (dbError) return { error: { form: [dbError.message] }, data: null }

  return { error: null, data }
}

export async function createLane(input: LaneInput) {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  const parsed = laneSchema.safeParse(input)
  if (!parsed.success) {
    return { error: { form: parsed.error.issues.map(i => i.message) }, data: null }
  }

  const v = parsed.data
  const { data, error: dbError } = await supabase
    .from('crm_lanes')
    .insert({
      org_id: orgId!,
      origin_city: v.origin_city,
      origin_state: v.origin_state,
      origin_zip: v.origin_zip || null,
      destination_city: v.destination_city,
      destination_state: v.destination_state,
      destination_zip: v.destination_zip || null,
      distance_miles: v.distance_miles ?? null,
      preferred_equipment: v.preferred_equipment,
      notes: v.notes || null,
      status: v.status,
    })
    .select()
    .single()

  if (dbError) return { error: { form: [dbError.message] }, data: null }

  revalidatePath('/crm')
  return { error: null, data }
}

export async function updateLane(id: string, input: Partial<LaneInput>) {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  const parsed = laneSchema.partial().safeParse(input)
  if (!parsed.success) {
    return { error: { form: parsed.error.issues.map(i => i.message) }, data: null }
  }

  const v = parsed.data
  const updateData: Record<string, unknown> = {}
  if (v.origin_city !== undefined) updateData.origin_city = v.origin_city
  if (v.origin_state !== undefined) updateData.origin_state = v.origin_state
  if (v.origin_zip !== undefined) updateData.origin_zip = v.origin_zip || null
  if (v.destination_city !== undefined) updateData.destination_city = v.destination_city
  if (v.destination_state !== undefined) updateData.destination_state = v.destination_state
  if (v.destination_zip !== undefined) updateData.destination_zip = v.destination_zip || null
  if (v.distance_miles !== undefined) updateData.distance_miles = v.distance_miles ?? null
  if (v.preferred_equipment !== undefined) updateData.preferred_equipment = v.preferred_equipment
  if (v.notes !== undefined) updateData.notes = v.notes || null
  if (v.status !== undefined) updateData.status = v.status

  const { data, error: dbError } = await supabase
    .from('crm_lanes')
    .update(updateData)
    .eq('id', id)
    .eq('org_id', orgId!)
    .select()
    .single()

  if (dbError) return { error: { form: [dbError.message] }, data: null }

  revalidatePath('/crm')
  return { error: null, data }
}

export async function getLaneDetail(id: string) {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  // Fetch lane
  const { data: lane, error: laneError } = await supabase
    .from('crm_lanes')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId!)
    .single()

  if (laneError) return { error: { form: [laneError.message] }, data: null }

  // Fetch associated companies via junction
  const { data: rawLc2 } = await supabase
    .from('crm_lane_companies')
    .select('*')
    .eq('lane_id', id)
  const laneCos = (rawLc2 ?? []) as CrmLaneCompany[]

  const companyIds = laneCos.map(lc => lc.company_id)
  let companies: Array<Record<string, unknown>> = []
  if (companyIds.length > 0) {
    const { data: rawCRows } = await supabase
      .from('crm_companies')
      .select('id, name, company_type')
      .in('id', companyIds)
    const companyRows = (rawCRows ?? []) as Pick<CrmCompany, 'id' | 'name' | 'company_type'>[]

    const lcMap = new Map(laneCos.map(lc => [lc.company_id, lc]))
    companies = companyRows.map(c => ({
      ...c,
      relationship: lcMap.get(c.id)?.relationship ?? null,
      contracted_rate: lcMap.get(c.id)?.contracted_rate ?? null,
    }))
  }

  // Fetch rate agreements for this lane
  const { data: rawRa } = await supabase
    .from('crm_rate_agreements')
    .select('*')
    .eq('lane_id', id)
    .order('effective_date', { ascending: false })
  const rateAgreements = (rawRa ?? []) as CrmRateAgreement[]

  // Enrich rate agreements with company names
  const raCompanyIds = [...new Set(rateAgreements.map(ra => ra.company_id))]
  let raCompanyMap = new Map<string, string>()
  if (raCompanyIds.length > 0) {
    const { data: raCompanies } = await supabase
      .from('crm_companies')
      .select('id, name')
      .in('id', raCompanyIds)
    raCompanyMap = new Map((raCompanies ?? []).map(c => [c.id, c.name]))
  }

  const enrichedRateAgreements = rateAgreements.map(ra => ({
    ...ra,
    company_name: raCompanyMap.get(ra.company_id) ?? null,
  }))

  return {
    error: null,
    data: {
      ...lane,
      companies,
      rateAgreements: enrichedRateAgreements,
    },
  }
}

// ============================================================
// Rate Agreement actions
// ============================================================

export async function getRateAgreements(filters?: {
  companyId?: string
  laneId?: string
  status?: CrmAgreementStatus
}) {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  let query = supabase
    .from('crm_rate_agreements')
    .select('*')
    .eq('org_id', orgId!)
    .order('effective_date', { ascending: false })

  if (filters?.companyId) {
    query = query.eq('company_id', filters.companyId)
  }
  if (filters?.laneId) {
    query = query.eq('lane_id', filters.laneId)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data: rawAgreements, error: dbError } = await query
  if (dbError) return { error: { form: [dbError.message] }, data: null }
  const agreements = (rawAgreements ?? []) as CrmRateAgreement[]

  // Enrich with company names and lane info
  const compIds = [...new Set(agreements.map(a => a.company_id))]
  const lnIds = [...new Set(agreements.map(a => a.lane_id).filter(Boolean) as string[])]

  let compMap = new Map<string, { id: string; name: string }>()
  if (compIds.length > 0) {
    const { data: comps } = await supabase
      .from('crm_companies')
      .select('id, name')
      .in('id', compIds)
    compMap = new Map((comps ?? []).map(c => [c.id, c]))
  }

  let laneMap = new Map<string, { id: string; origin_city: string; origin_state: string; destination_city: string; destination_state: string }>()
  if (lnIds.length > 0) {
    const { data: lns } = await supabase
      .from('crm_lanes')
      .select('id, origin_city, origin_state, destination_city, destination_state')
      .in('id', lnIds)
    laneMap = new Map((lns ?? []).map(l => [l.id, l]))
  }

  const enriched = agreements.map(a => ({
    ...a,
    company: compMap.get(a.company_id) ?? null,
    lane: a.lane_id ? laneMap.get(a.lane_id) ?? null : null,
  }))

  return { error: null, data: enriched }
}

export async function createRateAgreement(input: RateAgreementInput) {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  const parsed = rateAgreementSchema.safeParse(input)
  if (!parsed.success) {
    return { error: { form: parsed.error.issues.map(i => i.message) }, data: null }
  }

  const v = parsed.data
  const { data, error: dbError } = await supabase
    .from('crm_rate_agreements')
    .insert({
      org_id: orgId!,
      company_id: v.company_id,
      lane_id: v.lane_id || null,
      rate_type: v.rate_type,
      rate_amount: v.rate_amount,
      effective_date: v.effective_date,
      expiry_date: v.expiry_date || null,
      min_volume: v.min_volume ?? null,
      equipment_type: v.equipment_type || null,
      document_url: v.document_url || null,
      status: v.status,
    })
    .select()
    .single()

  if (dbError) return { error: { form: [dbError.message] }, data: null }

  revalidatePath('/crm')
  return { error: null, data }
}

export async function updateRateAgreement(id: string, input: Partial<RateAgreementInput>) {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  const parsed = rateAgreementSchema.partial().safeParse(input)
  if (!parsed.success) {
    return { error: { form: parsed.error.issues.map(i => i.message) }, data: null }
  }

  const v = parsed.data
  const updateData: Record<string, unknown> = {}
  if (v.company_id !== undefined) updateData.company_id = v.company_id
  if (v.lane_id !== undefined) updateData.lane_id = v.lane_id || null
  if (v.rate_type !== undefined) updateData.rate_type = v.rate_type
  if (v.rate_amount !== undefined) updateData.rate_amount = v.rate_amount
  if (v.effective_date !== undefined) updateData.effective_date = v.effective_date
  if (v.expiry_date !== undefined) updateData.expiry_date = v.expiry_date || null
  if (v.min_volume !== undefined) updateData.min_volume = v.min_volume ?? null
  if (v.equipment_type !== undefined) updateData.equipment_type = v.equipment_type || null
  if (v.document_url !== undefined) updateData.document_url = v.document_url || null
  if (v.status !== undefined) updateData.status = v.status

  const { data, error: dbError } = await supabase
    .from('crm_rate_agreements')
    .update(updateData)
    .eq('id', id)
    .eq('org_id', orgId!)
    .select()
    .single()

  if (dbError) return { error: { form: [dbError.message] }, data: null }

  revalidatePath('/crm')
  return { error: null, data }
}

// ============================================================
// Activity actions
// ============================================================

export async function getActivities(filters?: {
  companyId?: string
  type?: CrmActivityType
  limit?: number
}) {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  const resultLimit = filters?.limit ?? 50

  let query = supabase
    .from('crm_activities')
    .select('*')
    .eq('org_id', orgId!)
    .order('created_at', { ascending: false })
    .limit(resultLimit)

  if (filters?.companyId) {
    query = query.eq('company_id', filters.companyId)
  }
  if (filters?.type) {
    query = query.eq('activity_type', filters.type)
  }

  const { data, error: dbError } = await query
  if (dbError) return { error: { form: [dbError.message] }, data: null }

  return { error: null, data }
}

export async function createActivity(input: ActivityInput) {
  const { error, supabase, orgId, user } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  const parsed = activitySchema.safeParse(input)
  if (!parsed.success) {
    return { error: { form: parsed.error.issues.map(i => i.message) }, data: null }
  }

  const v = parsed.data
  const { data, error: dbError } = await supabase
    .from('crm_activities')
    .insert({
      org_id: orgId!,
      user_id: user!.id,
      activity_type: v.activity_type,
      subject: v.subject,
      company_id: v.company_id || null,
      contact_id: v.contact_id || null,
      lane_id: v.lane_id || null,
      body: v.body || null,
      scheduled_at: v.scheduled_at || null,
      outcome: v.outcome || null,
      follow_up_date: v.follow_up_date || null,
      completed_at: null,
    })
    .select()
    .single()

  if (dbError) return { error: { form: [dbError.message] }, data: null }

  revalidatePath('/crm')
  return { error: null, data }
}

export async function updateActivity(id: string, data: { completed_at?: string; outcome?: string }) {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  const updateData: Record<string, unknown> = {}
  if (data.completed_at !== undefined) updateData.completed_at = data.completed_at
  if (data.outcome !== undefined) updateData.outcome = data.outcome

  const { data: updated, error: dbError } = await supabase
    .from('crm_activities')
    .update(updateData)
    .eq('id', id)
    .eq('org_id', orgId!)
    .select()
    .single()

  if (dbError) return { error: { form: [dbError.message] }, data: null }

  revalidatePath('/crm')
  return { error: null, data: updated }
}

// ============================================================
// Dashboard action
// ============================================================

export async function getCrmDashboard() {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  // Top 10 companies by total_revenue (last 90 days filter via last_load_date)
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const ninetyDaysStr = ninetyDaysAgo.toISOString().split('T')[0]

  const { data: topCompanies } = await supabase
    .from('crm_companies')
    .select('id, name, company_type, total_revenue, total_loads, last_load_date')
    .eq('org_id', orgId!)
    .gte('last_load_date', ninetyDaysStr)
    .order('total_revenue', { ascending: false })
    .limit(10)

  // Expiring rate agreements (within 30 days, status='active')
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const thirtyDaysStr = thirtyDaysFromNow.toISOString().split('T')[0]
  const todayStr = new Date().toISOString().split('T')[0]

  const { data: expiringAgreements } = await supabase
    .from('crm_rate_agreements')
    .select('*')
    .eq('org_id', orgId!)
    .eq('status', 'active')
    .gte('expiry_date', todayStr)
    .lte('expiry_date', thirtyDaysStr)
    .order('expiry_date')

  // Pending follow-ups count
  const { count: pendingFollowUps } = await supabase
    .from('crm_activities')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId!)
    .lte('follow_up_date', todayStr)
    .is('completed_at', null)

  // Prospect count
  const { count: prospectCount } = await supabase
    .from('crm_companies')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId!)
    .eq('company_type', 'prospect')
    .eq('status', 'active')

  // Broker pay performance (top 10 by fastest days_to_pay)
  const { data: brokerPayPerformance } = await supabase
    .from('crm_companies')
    .select('id, name, days_to_pay, total_revenue, total_loads')
    .eq('org_id', orgId!)
    .eq('company_type', 'broker')
    .not('days_to_pay', 'is', null)
    .order('days_to_pay', { ascending: true })
    .limit(10)

  // Enrich expiring agreements with company names
  const rawAgreements = (expiringAgreements ?? []) as CrmRateAgreement[]
  const agreementCompanyIds = [...new Set(rawAgreements.map(a => a.company_id))]
  let agreementCompanyMap = new Map<string, string>()
  if (agreementCompanyIds.length > 0) {
    const { data: agComps } = await supabase
      .from('crm_companies')
      .select('id, name')
      .in('id', agreementCompanyIds)
    agreementCompanyMap = new Map((agComps ?? []).map(c => [c.id, c.name]))
  }
  const enrichedAgreements = rawAgreements.map(a => ({
    ...a,
    company_name: agreementCompanyMap.get(a.company_id) ?? null,
  }))

  return {
    error: null,
    data: {
      topCompanies: topCompanies ?? [],
      expiringAgreements: enrichedAgreements,
      pendingFollowUps: pendingFollowUps ?? 0,
      prospectCount: prospectCount ?? 0,
      brokerPayPerformance: brokerPayPerformance ?? [],
    },
  }
}

// ============================================================
// Lane-Company linking action
// ============================================================

export async function linkLaneCompany(input: {
  lane_id: string
  company_id: string
  relationship: 'shipper' | 'broker' | 'receiver'
  contracted_rate?: number | null
  contract_start?: string | null
  contract_end?: string | null
}) {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  // Verify lane belongs to org
  const { data: lane } = await supabase
    .from('crm_lanes')
    .select('id')
    .eq('id', input.lane_id)
    .eq('org_id', orgId!)
    .single()
  if (!lane) return { error: { form: ['Lane not found'] }, data: null }

  const { data, error: dbError } = await supabase
    .from('crm_lane_companies')
    .insert({
      lane_id: input.lane_id,
      company_id: input.company_id,
      relationship: input.relationship,
      contracted_rate: input.contracted_rate ?? null,
      contract_start: input.contract_start ?? null,
      contract_end: input.contract_end ?? null,
    })
    .select()
    .single()

  if (dbError) return { error: { form: [dbError.message] }, data: null }

  revalidatePath('/crm')
  return { error: null, data }
}
