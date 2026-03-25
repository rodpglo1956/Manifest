import { z } from 'zod'

// ============================================================
// CRM Zod Validation Schemas
// Phase 09: CRM & Cross-Module Integration
// ============================================================

const companyTypes = ['customer', 'broker', 'vendor', 'partner', 'prospect'] as const
const companyStatuses = ['active', 'inactive', 'blacklisted', 'prospect'] as const
const laneStatuses = ['active', 'inactive', 'seasonal'] as const
const rateTypes = ['per_mile', 'flat_rate', 'percentage', 'hourly'] as const
const agreementStatuses = ['active', 'expired', 'pending', 'rejected'] as const
const activityTypes = ['call', 'email', 'note', 'meeting', 'rate_negotiation', 'load_booked', 'issue', 'follow_up', 'system'] as const

// Company schema
export const companySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must be at most 100 characters'),
  company_type: z.enum(companyTypes).default('prospect'),
  mc_number: z.string().optional().or(z.literal('')),
  dot_number: z.string().optional().or(z.literal('')),
  credit_score: z.coerce.number().int().min(0).max(999).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  days_to_pay: z.coerce.number().int().positive('Must be a positive number').optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  payment_terms: z.string().optional().or(z.literal('')),
  factoring_company: z.string().optional().or(z.literal('')),
  primary_contact_name: z.string().optional().or(z.literal('')),
  primary_contact_email: z.string().email('Invalid email').optional().or(z.literal('')),
  primary_contact_phone: z.string().optional().or(z.literal('')),
  address_line1: z.string().optional().or(z.literal('')),
  address_line2: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  zip: z.string().optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  status: z.enum(companyStatuses).default('prospect'),
  tags: z.array(z.string()).default([]),
})

export type CompanyInput = z.input<typeof companySchema>

// Contact schema
export const contactSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  company_id: z.string().uuid('Invalid company ID'),
  title: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  is_primary: z.boolean().default(false),
  notes: z.string().optional().or(z.literal('')),
})

export type ContactInput = z.input<typeof contactSchema>

// Lane schema
export const laneSchema = z.object({
  origin_city: z.string().min(1, 'Origin city is required'),
  origin_state: z.string().min(1, 'Origin state is required'),
  origin_zip: z.string().optional().or(z.literal('')),
  destination_city: z.string().min(1, 'Destination city is required'),
  destination_state: z.string().min(1, 'Destination state is required'),
  destination_zip: z.string().optional().or(z.literal('')),
  distance_miles: z.coerce.number().int().positive('Must be a positive number').optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  preferred_equipment: z.array(z.string()).default([]),
  notes: z.string().optional().or(z.literal('')),
  status: z.enum(laneStatuses).default('active'),
})

export type LaneInput = z.input<typeof laneSchema>

// Rate Agreement schema
export const rateAgreementSchema = z.object({
  company_id: z.string().uuid('Invalid company ID'),
  rate_type: z.enum(rateTypes),
  rate_amount: z.coerce.number().positive('Rate must be positive'),
  effective_date: z.string().min(1, 'Effective date is required'),
  lane_id: z.string().uuid('Invalid lane ID').optional().or(z.literal('')),
  expiry_date: z.string().optional().or(z.literal('')),
  min_volume: z.coerce.number().int().positive('Must be a positive number').optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  equipment_type: z.string().optional().or(z.literal('')),
  document_url: z.string().optional().or(z.literal('')),
  status: z.enum(agreementStatuses).default('pending'),
})

export type RateAgreementInput = z.input<typeof rateAgreementSchema>

// Activity schema
export const activitySchema = z.object({
  activity_type: z.enum(activityTypes),
  subject: z.string().min(1, 'Subject is required'),
  company_id: z.string().uuid('Invalid company ID').optional().or(z.literal('')),
  contact_id: z.string().uuid('Invalid contact ID').optional().or(z.literal('')),
  lane_id: z.string().uuid('Invalid lane ID').optional().or(z.literal('')),
  body: z.string().optional().or(z.literal('')),
  scheduled_at: z.string().optional().or(z.literal('')),
  outcome: z.string().optional().or(z.literal('')),
  follow_up_date: z.string().optional().or(z.literal('')),
})

export type ActivityInput = z.input<typeof activitySchema>
