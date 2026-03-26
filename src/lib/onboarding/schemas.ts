import { z } from 'zod'

// ============================================================
// Onboarding Wizard Schemas
// ============================================================

export type OnboardingCarrierType = 'medical_transport' | 'trucking' | 'mixed_fleet' | 'courier' | 'other'

export type FleetSizeRange = '1-5' | '6-20' | '21-50' | '51+'

export const businessProfileSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  address_line1: z.string().optional().default(''),
  address_city: z.string().optional().default(''),
  address_state: z.string().optional().default(''),
  address_zip: z.string().optional().default(''),
  carrier_type: z.enum(['medical_transport', 'trucking', 'mixed_fleet', 'courier', 'other']),
  dot_number: z.string().optional().default(''),
  fleet_size_range: z.enum(['1-5', '6-20', '21-50', '51+']),
})

export type BusinessProfileInput = z.input<typeof businessProfileSchema>

export const firstVehicleSchema = z.object({
  year: z.coerce.number().min(1900, 'Invalid year').max(2100, 'Invalid year'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  vin: z.string().optional().default(''),
  unit_number: z.string().min(1, 'Unit number is required'),
})

export type FirstVehicleInput = z.input<typeof firstVehicleSchema>

export const firstDriverSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  cdl_number: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  email: z.string().email('Invalid email').or(z.literal('')).optional().default(''),
})

export type FirstDriverInput = z.input<typeof firstDriverSchema>

export const integrationsSchema = z.object({
  eld_provider: z.string().optional().default(''),
  fuel_card_provider: z.string().optional().default(''),
  accounting_provider: z.string().optional().default(''),
})

export type IntegrationsInput = z.input<typeof integrationsSchema>

export const planSelectionSchema = z.object({
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']),
})

export type PlanSelectionInput = z.input<typeof planSelectionSchema>
