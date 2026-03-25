import { z } from 'zod'

export const complianceProfileSchema = z.object({
  carrier_type: z.enum([
    'medical_transport', 'box_truck', 'hotshot',
    'straight_truck', 'class_8', 'mixed_fleet',
  ]),
  dot_number: z.string().optional().nullable(),
  mc_number: z.string().optional().nullable(),
  is_dot_regulated: z.boolean().default(false),
  operating_authority_status: z.string().optional().nullable(),
  insurance_provider: z.string().optional().nullable(),
  insurance_policy_number: z.string().optional().nullable(),
  insurance_expiry: z.string().optional().nullable(),
  ifta_license_number: z.string().optional().nullable(),
  ifta_expiry: z.string().optional().nullable(),
  ucr_registration_year: z.coerce.number().int().optional().nullable(),
  ucr_expiry: z.string().optional().nullable(),
  drug_testing_consortium: z.string().optional().nullable(),
  drug_testing_account_id: z.string().optional().nullable(),
})

export type ComplianceProfileInput = z.input<typeof complianceProfileSchema>

export const complianceItemSchema = z.object({
  category: z.enum([
    'dot_inspection', 'insurance', 'ifta', 'ucr',
    'drug_testing', 'driver_qualification', 'vehicle_registration',
    'operating_authority', 'hazmat', 'medical_card',
    'cdl_renewal', 'annual_inspection', 'state_permit',
    'bod_filing', 'insurance_filing', 'custom',
  ]),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  status: z.enum(['upcoming', 'due_soon', 'overdue', 'completed', 'waived', 'not_applicable']).default('upcoming'),
  assigned_to: z.string().uuid().optional().nullable(),
  vehicle_id: z.string().uuid().optional().nullable(),
  driver_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  recurrence_rule: z.enum(['annual', 'biennial', 'quarterly', 'monthly', 'custom']).optional().nullable(),
  recurrence_months: z.coerce.number().int().positive().optional().nullable(),
  alert_days_before: z.array(z.number().int()).optional(),
})

export type ComplianceItemInput = z.input<typeof complianceItemSchema>

export const driverQualificationSchema = z.object({
  cdl_number: z.string().optional().nullable(),
  cdl_state: z.string().optional().nullable(),
  cdl_class: z.enum(['A', 'B', 'C', 'none']).optional().nullable(),
  cdl_expiry: z.string().optional().nullable(),
  medical_card_expiry: z.string().optional().nullable(),
  endorsements: z.array(z.string()).optional().nullable(),
  restrictions: z.array(z.string()).optional().nullable(),
  mvr_last_pulled: z.string().optional().nullable(),
  mvr_status: z.string().optional().nullable(),
  drug_test_last_date: z.string().optional().nullable(),
  drug_test_result: z.string().optional().nullable(),
  annual_review_date: z.string().optional().nullable(),
  road_test_date: z.string().optional().nullable(),
  application_date: z.string().optional().nullable(),
  hire_date: z.string().optional().nullable(),
})

export type DriverQualificationInput = z.input<typeof driverQualificationSchema>

export const inspectionSchema = z.object({
  vehicle_id: z.string().uuid('Vehicle is required'),
  inspection_type: z.enum([
    'annual_dot', 'pre_trip', 'post_trip', 'roadside',
    'state', 'customer_required', 'internal',
  ]),
  inspector_name: z.string().optional().nullable(),
  inspection_date: z.string().min(1, 'Inspection date is required'),
  expiry_date: z.string().optional().nullable(),
  result: z.enum(['pass', 'fail', 'conditional']).optional().nullable(),
  defects_found: z.array(z.string()).optional().nullable(),
  defects_corrected: z.array(z.string()).optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type InspectionInput = z.input<typeof inspectionSchema>
