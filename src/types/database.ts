// TypeScript types for Supabase database tables
// Matches PRD-01 Section 2.3 schema exactly
// Note: RLS policies use (select auth.uid()) and (select auth.org_id()) patterns

export type CompanyType = 'dot_carrier' | 'non_dot_carrier' | 'both'

export type UserRole = 'admin' | 'dispatcher' | 'driver' | 'viewer'

// Phase 2: Driver, Vehicle, Load types
export type DriverStatus = 'active' | 'inactive' | 'terminated'

export type VehicleType =
  | 'dry_van' | 'reefer' | 'flatbed' | 'sprinter' | 'box_truck'
  | 'medical_van' | 'hotshot' | 'straight_truck' | 'day_cab' | 'sleeper'
  | 'tanker' | 'dry_van_trailer' | 'flatbed_trailer' | 'reefer_trailer'
  | 'step_deck_trailer' | 'other'

export type VehicleStatus = 'active' | 'in_shop' | 'out_of_service' | 'parked' | 'sold' | 'totaled'

export type VehicleClass = 'class_1_2' | 'class_3_4' | 'class_5_6' | 'class_7' | 'class_8' | 'trailer' | 'other'

export type FuelType = 'diesel' | 'gasoline' | 'cng' | 'electric' | 'hybrid'

export type MaintenanceType =
  | 'oil_change' | 'tire_rotation' | 'tire_replacement' | 'brake_service'
  | 'transmission' | 'engine' | 'electrical' | 'hvac' | 'body_work'
  | 'dot_inspection' | 'preventive' | 'recall' | 'roadside_repair'
  | 'scheduled_service' | 'unscheduled_repair' | 'other'

export type FuelSource = 'manual' | 'fuel_card' | 'eld' | 'receipt_scan'

export type MaintenancePriority = 'low' | 'normal' | 'high' | 'critical'

export type EquipmentType = VehicleType

// Phase 4: Invoice types
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void'

export type PaymentMethod = 'check' | 'ach' | 'wire' | 'credit_card' | 'other' | ''

// Phase 3: Dispatch types
export type DispatchStatus =
  | 'assigned'
  | 'accepted'
  | 'en_route_pickup'
  | 'at_pickup'
  | 'en_route_delivery'
  | 'at_delivery'
  | 'completed'
  | 'rejected'

export type LoadStatus =
  | 'booked'
  | 'dispatched'
  | 'in_transit'
  | 'at_pickup'
  | 'loaded'
  | 'at_delivery'
  | 'delivered'
  | 'invoiced'
  | 'paid'
  | 'canceled'

export type RateType = 'flat' | 'per_mile' | 'hourly' | 'per_stop'

export type WeightUnit = 'lbs' | 'kg'

export type LicenseClass = 'A' | 'B' | 'C' | 'standard'

export type Organization = {
  id: string
  name: string
  dot_number: string | null
  mc_number: string | null
  address_line1: string | null
  address_city: string | null
  address_state: string | null
  address_zip: string | null
  phone: string | null
  email: string | null
  company_type: CompanyType
  created_at: string
  updated_at: string
}

export type Profile = {
  id: string
  org_id: string | null
  full_name: string | null
  role: UserRole
  phone: string | null
  avatar_url: string | null
  notification_preferences?: NotificationPreferences
  created_at: string
  updated_at: string
}

export type OrgMember = {
  id: string
  org_id: string
  user_id: string
  role: UserRole
  joined_at: string
}

export type Driver = {
  id: string
  org_id: string
  user_id: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  license_number: string | null
  license_state: string | null
  license_class: LicenseClass | null
  license_expiration: string | null
  hire_date: string | null
  status: DriverStatus
  current_vehicle_id: string | null
  home_terminal: string | null
  notes: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  created_at: string
  updated_at: string
}

export type Vehicle = {
  id: string
  org_id: string
  unit_number: string
  vin: string | null
  year: number | null
  make: string | null
  model: string | null
  vehicle_type: VehicleType
  vehicle_class: VehicleClass
  fuel_type: FuelType | null
  status: VehicleStatus
  license_plate: string | null
  license_state: string | null
  registration_expiry: string | null
  current_odometer: number | null
  odometer_updated_at: string | null
  avg_mpg: number | null
  purchase_date: string | null
  purchase_price: number | null
  current_value: number | null
  insurance_policy: string | null
  gps_device_id: string | null
  eld_provider: string | null
  eld_device_id: string | null
  photo_urls: string[] | null
  notes: string | null
  current_driver_id: string | null
  created_at: string
  updated_at: string
}

export type Load = {
  id: string
  org_id: string
  load_number: string | null
  status: LoadStatus

  // Pickup
  pickup_company: string | null
  pickup_address: string | null
  pickup_city: string | null
  pickup_state: string | null
  pickup_zip: string | null
  pickup_date: string | null
  pickup_time: string | null
  pickup_contact_name: string | null
  pickup_contact_phone: string | null
  pickup_reference: string | null
  pickup_notes: string | null

  // Delivery
  delivery_company: string | null
  delivery_address: string | null
  delivery_city: string | null
  delivery_state: string | null
  delivery_zip: string | null
  delivery_date: string | null
  delivery_time: string | null
  delivery_contact_name: string | null
  delivery_contact_phone: string | null
  delivery_reference: string | null
  delivery_notes: string | null

  // Freight
  commodity: string | null
  weight: number | null
  weight_unit: WeightUnit | null
  pieces: number | null
  equipment_type: EquipmentType | null
  temperature_min: number | null
  temperature_max: number | null
  hazmat: boolean

  // Rate
  rate_amount: number | null
  rate_type: RateType | null
  miles: number | null
  fuel_surcharge: number | null
  accessorial_charges: number | null
  total_charges: number | null

  // Assignment
  driver_id: string | null
  vehicle_id: string | null

  // Broker
  broker_name: string | null
  broker_contact: string | null
  broker_phone: string | null
  broker_email: string | null
  broker_mc_number: string | null
  broker_reference: string | null

  // Documents
  bol_url: string | null
  rate_confirmation_url: string | null
  pod_url: string | null

  // Meta
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type LoadStatusHistory = {
  id: string
  load_id: string
  old_status: string | null
  new_status: string
  changed_by: string | null
  location_lat: number | null
  location_lng: number | null
  notes: string | null
  created_at: string
}

export type LoadNumberSequence = {
  org_id: string
  last_number: number
}

export type Dispatch = {
  id: string
  org_id: string
  load_id: string
  driver_id: string
  vehicle_id: string | null
  status: DispatchStatus
  assigned_at: string
  accepted_at: string | null
  completed_at: string | null
  estimated_pickup_arrival: string | null
  estimated_delivery_arrival: string | null
  driver_notes: string | null
  dispatcher_notes: string | null
  assigned_by: string | null
  created_at: string
  updated_at: string
}

export type Invoice = {
  id: string
  org_id: string
  load_id: string | null
  invoice_number: string
  bill_to_company: string
  bill_to_email: string | null
  bill_to_address: string | null
  amount: number
  fuel_surcharge: number
  accessorials: number
  total: number
  status: InvoiceStatus
  issued_date: string | null
  due_date: string | null
  paid_date: string | null
  paid_amount: number | null
  payment_method: string | null
  notes: string | null
  pdf_url: string | null
  created_at: string
  updated_at: string
}

export type InvoiceNumberSequence = {
  org_id: string
  year_month: string
  last_number: number
}

// Phase 6: Alert types
export type AlertType = 'late_pickup' | 'driver_silent' | 'overdue_invoice' | 'dispatch_conflict' | 'eta_risk' | 'unassigned_load' | 'compliance_overdue' | 'compliance_due_soon' | 'compliance_approaching'

// Phase 7: Compliance types
export type CarrierType = 'medical_transport' | 'box_truck' | 'hotshot' | 'straight_truck' | 'class_8' | 'mixed_fleet'

export type ComplianceCategory =
  | 'dot_inspection' | 'insurance' | 'ifta' | 'ucr'
  | 'drug_testing' | 'driver_qualification' | 'vehicle_registration'
  | 'operating_authority' | 'hazmat' | 'medical_card'
  | 'cdl_renewal' | 'annual_inspection' | 'state_permit'
  | 'bod_filing' | 'insurance_filing' | 'scheduled_service' | 'custom'

export type ComplianceItemStatus = 'upcoming' | 'due_soon' | 'overdue' | 'completed' | 'waived' | 'not_applicable'

export type ComplianceAlertType = 'approaching' | 'due_soon' | 'overdue' | 'expired' | 'completed'

export type RecurrenceRule = 'annual' | 'biennial' | 'quarterly' | 'monthly' | 'custom'

export type InspectionType = 'annual_dot' | 'pre_trip' | 'post_trip' | 'roadside' | 'state' | 'customer_required' | 'internal'

export type InspectionResult = 'pass' | 'fail' | 'conditional'

export type CdlClass = 'A' | 'B' | 'C' | 'none'

export type ComplianceProfile = {
  id: string
  org_id: string
  dot_number: string | null
  mc_number: string | null
  is_dot_regulated: boolean
  carrier_type: CarrierType
  operating_authority_status: string | null
  insurance_provider: string | null
  insurance_policy_number: string | null
  insurance_expiry: string | null
  ifta_license_number: string | null
  ifta_expiry: string | null
  ucr_registration_year: number | null
  ucr_expiry: string | null
  drug_testing_consortium: string | null
  drug_testing_account_id: string | null
  created_at: string
  updated_at: string
}

export type ComplianceItem = {
  id: string
  org_id: string
  compliance_profile_id: string
  category: ComplianceCategory
  title: string
  description: string | null
  due_date: string | null
  completed_date: string | null
  status: ComplianceItemStatus
  assigned_to: string | null
  vehicle_id: string | null
  driver_id: string | null
  document_urls: string[] | null
  notes: string | null
  recurrence_rule: RecurrenceRule | null
  recurrence_months: number | null
  alert_days_before: number[]
  created_at: string
  updated_at: string
}

export type ComplianceAlert = {
  id: string
  org_id: string
  compliance_item_id: string
  alert_type: ComplianceAlertType
  days_until_due: number | null
  message: string
  acknowledged: boolean
  acknowledged_by: string | null
  acknowledged_at: string | null
  notification_sent: boolean
  created_at: string
}

export type DriverQualification = {
  id: string
  org_id: string
  driver_id: string
  cdl_number: string | null
  cdl_state: string | null
  cdl_class: CdlClass | null
  cdl_expiry: string | null
  medical_card_expiry: string | null
  endorsements: string[] | null
  restrictions: string[] | null
  mvr_last_pulled: string | null
  mvr_status: string | null
  drug_test_last_date: string | null
  drug_test_result: string | null
  annual_review_date: string | null
  road_test_date: string | null
  application_date: string | null
  hire_date: string | null
  termination_date: string | null
  dq_file_complete: boolean
  missing_documents: string[] | null
  created_at: string
  updated_at: string
}

export type Inspection = {
  id: string
  org_id: string
  vehicle_id: string
  inspection_type: InspectionType
  inspector_name: string | null
  inspection_date: string
  expiry_date: string | null
  result: InspectionResult | null
  defects_found: string[] | null
  defects_corrected: string[] | null
  document_urls: string[] | null
  notes: string | null
  created_at: string
}

export type IFTARecord = {
  id: string
  org_id: string
  vehicle_id: string
  quarter: string
  jurisdiction: string
  miles_traveled: number
  gallons_purchased: number
  tax_rate: number | null
  tax_owed: number | null
  tax_paid: number | null
  net_tax: number | null
  source: string
  created_at: string
}

export type AlertSeverity = 'info' | 'warning' | 'critical'

// Phase 6: Daily snapshot type
export type DailySnapshot = {
  id: string
  org_id: string
  snapshot_date: string
  loads_booked: number
  loads_delivered: number
  loads_canceled: number
  revenue: number
  total_miles: number
  revenue_per_mile: number
  on_time_deliveries: number
  total_deliveries: number
  on_time_percentage: number
  active_drivers: number
  invoices_generated: number
  invoices_paid: number
  created_at: string
}

// Phase 5: Marie AI types
export type MarieQuery = {
  id: string
  org_id: string
  user_id: string
  query_text: string
  response_text: string | null
  query_type: string | null
  tokens_used: number | null
  latency_ms: number | null
  model: string | null
  success: boolean
  error_message: string | null
  created_at: string
}

export type ProactiveAlert = {
  id: string
  org_id: string
  alert_type: string
  severity: string
  title: string
  message: string
  related_entity_type: string | null
  related_entity_id: string | null
  acknowledged: boolean
  acknowledged_by: string | null
  created_at: string
}

// Phase 6: Push notification types
export type PushSubscription = {
  id: string
  user_id: string
  org_id: string
  endpoint: string
  keys_p256dh: string
  keys_auth: string
  created_at: string
}

export type NotificationPreferences = {
  new_dispatch: boolean
  load_status_change: boolean
  critical_alert: boolean
  invoice_paid: boolean
  driver_response: boolean
}

// Phase 9: CRM types
export type CrmCompanyType = 'customer' | 'broker' | 'vendor' | 'partner' | 'prospect'
export type CrmCompanyStatus = 'active' | 'inactive' | 'blacklisted' | 'prospect'
export type CrmLaneStatus = 'active' | 'inactive' | 'seasonal'
export type CrmActivityType = 'call' | 'email' | 'note' | 'meeting' | 'rate_negotiation' | 'load_booked' | 'issue' | 'follow_up' | 'system'
export type CrmRateType = 'per_mile' | 'flat_rate' | 'percentage' | 'hourly'
export type CrmAgreementStatus = 'active' | 'expired' | 'pending' | 'rejected'
export type CrmLaneRelationship = 'shipper' | 'broker' | 'receiver'

export type CrmCompany = {
  id: string
  org_id: string
  name: string
  company_type: CrmCompanyType
  mc_number: string | null
  dot_number: string | null
  credit_score: number | null
  days_to_pay: number | null
  payment_terms: string | null
  factoring_company: string | null
  primary_contact_name: string | null
  primary_contact_email: string | null
  primary_contact_phone: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  zip: string | null
  website: string | null
  notes: string | null
  status: CrmCompanyStatus
  tags: string[]
  total_revenue: number
  total_loads: number
  avg_rate_per_mile: number | null
  last_load_date: string | null
  created_at: string
  updated_at: string
}

export type CrmContact = {
  id: string
  org_id: string
  company_id: string
  first_name: string
  last_name: string
  title: string | null
  email: string | null
  phone: string | null
  is_primary: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export type CrmLane = {
  id: string
  org_id: string
  origin_city: string
  origin_state: string
  origin_zip: string | null
  destination_city: string
  destination_state: string
  destination_zip: string | null
  distance_miles: number | null
  avg_rate_per_mile: number | null
  last_rate: number | null
  last_run_date: string | null
  total_runs: number
  preferred_equipment: string[] | null
  notes: string | null
  status: CrmLaneStatus
  created_at: string
  updated_at: string
}

export type CrmLaneCompany = {
  id: string
  lane_id: string
  company_id: string
  relationship: CrmLaneRelationship
  contracted_rate: number | null
  contract_start: string | null
  contract_end: string | null
  created_at: string
}

export type CrmRateAgreement = {
  id: string
  org_id: string
  company_id: string
  lane_id: string | null
  rate_type: CrmRateType
  rate_amount: number
  effective_date: string
  expiry_date: string | null
  min_volume: number | null
  equipment_type: string | null
  document_url: string | null
  status: CrmAgreementStatus
  created_at: string
}

export type CrmActivity = {
  id: string
  org_id: string
  activity_type: CrmActivityType
  company_id: string | null
  contact_id: string | null
  lane_id: string | null
  user_id: string
  subject: string | null
  body: string | null
  scheduled_at: string | null
  completed_at: string | null
  outcome: string | null
  follow_up_date: string | null
  created_at: string
}

// Phase 10: Billing types
export type BillingPlan = 'free' | 'starter' | 'professional' | 'enterprise'
export type BillingCycle = 'monthly' | 'annual'
export type BillingStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused' | 'unpaid'
export type BillingInvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'

export type BillingAccount = {
  id: string
  org_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: BillingPlan
  billing_cycle: BillingCycle
  monthly_rate: number | null
  annual_rate: number | null
  trial_ends_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  status: BillingStatus
  payment_method_last4: string | null
  payment_method_brand: string | null
  cancellation_reason: string | null
  canceled_at: string | null
  created_at: string
  updated_at: string
}

export type PlanLimits = {
  id: string
  plan: BillingPlan
  max_vehicles: number
  max_drivers: number
  max_loads_per_month: number
  max_users: number
  compliance_module: boolean
  ifta_module: boolean
  crm_module: boolean
  ai_assistant: boolean
  ai_queries_per_month: number
  voice_minutes_per_month: number
  api_access: boolean
  white_label: boolean
  priority_support: boolean
  created_at: string
}

export type UsageRecord = {
  id: string
  org_id: string
  period_start: string
  period_end: string
  vehicles_count: number
  drivers_count: number
  loads_count: number
  users_count: number
  ai_queries_count: number
  voice_minutes_used: number
  created_at: string
  updated_at: string
}

export type BillingInvoice = {
  id: string
  org_id: string
  stripe_invoice_id: string | null
  amount: number
  tax: number
  total: number
  status: BillingInvoiceStatus
  period_start: string | null
  period_end: string | null
  due_date: string | null
  paid_at: string | null
  pdf_url: string | null
  created_at: string
}

// Phase 8: Fleet management types
export type MaintenanceRecord = {
  id: string
  org_id: string
  vehicle_id: string
  maintenance_type: MaintenanceType
  description: string
  vendor_name: string | null
  vendor_location: string | null
  odometer_at_service: number | null
  cost_parts: number
  cost_labor: number
  cost_total: number
  warranty_covered: boolean
  date_in: string
  date_out: string | null
  downtime_days: number | null
  document_urls: string[] | null
  next_service_odometer: number | null
  next_service_date: string | null
  created_at: string
  updated_at: string
}

export type MaintenanceSchedule = {
  id: string
  org_id: string
  vehicle_id: string | null
  vehicle_class: VehicleClass | null
  maintenance_type: MaintenanceType
  interval_miles: number | null
  interval_days: number | null
  description: string | null
  estimated_cost: number | null
  priority: MaintenancePriority
  active: boolean
  created_at: string
  updated_at: string
}

export type FuelTransaction = {
  id: string
  org_id: string
  vehicle_id: string
  driver_id: string | null
  transaction_date: string
  location: string | null
  city: string | null
  state: string | null
  gallons: number
  price_per_gallon: number | null
  total_cost: number
  odometer_reading: number | null
  receipt_url: string | null
  source: FuelSource
  created_at: string
}

export type VehicleAssignment = {
  id: string
  org_id: string
  vehicle_id: string
  driver_id: string
  assigned_at: string
  unassigned_at: string | null
  reason: string | null
  created_at: string
}

// Supabase Database type for client typing
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Organization, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Profile, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      org_members: {
        Row: OrgMember
        Insert: Omit<OrgMember, 'id' | 'joined_at'> & {
          id?: string
          joined_at?: string
        }
        Update: Partial<Omit<OrgMember, 'id'>> & {
          joined_at?: string
        }
        Relationships: []
      }
      drivers: {
        Row: Driver
        Insert: Omit<Driver, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Driver, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: Vehicle
        Insert: Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'vehicle_class' | 'fuel_type' | 'license_plate' | 'license_state' | 'registration_expiry' | 'current_odometer' | 'odometer_updated_at' | 'avg_mpg' | 'purchase_date' | 'purchase_price' | 'current_value' | 'insurance_policy' | 'gps_device_id' | 'eld_provider' | 'eld_device_id' | 'photo_urls' | 'notes' | 'current_driver_id'> & {
          id?: string
          created_at?: string
          updated_at?: string
          vehicle_class?: VehicleClass
          fuel_type?: FuelType | null
          license_plate?: string | null
          license_state?: string | null
          registration_expiry?: string | null
          current_odometer?: number | null
          odometer_updated_at?: string | null
          avg_mpg?: number | null
          purchase_date?: string | null
          purchase_price?: number | null
          current_value?: number | null
          insurance_policy?: string | null
          gps_device_id?: string | null
          eld_provider?: string | null
          eld_device_id?: string | null
          photo_urls?: string[] | null
          notes?: string | null
          current_driver_id?: string | null
        }
        Update: Partial<Omit<Vehicle, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      loads: {
        Row: Load
        Insert: Omit<Load, 'id' | 'load_number' | 'created_at' | 'updated_at'> & {
          id?: string
          load_number?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Load, 'id' | 'load_number' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      load_status_history: {
        Row: LoadStatusHistory
        Insert: Omit<LoadStatusHistory, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<LoadStatusHistory, 'id' | 'created_at'>>
        Relationships: []
      }
      dispatches: {
        Row: Dispatch
        Insert: Omit<Dispatch, 'id' | 'assigned_at' | 'accepted_at' | 'completed_at' | 'driver_notes' | 'created_at' | 'updated_at'> & {
          id?: string
          assigned_at?: string
          accepted_at?: string | null
          completed_at?: string | null
          driver_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Dispatch, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      load_number_sequences: {
        Row: LoadNumberSequence
        Insert: LoadNumberSequence
        Update: Partial<LoadNumberSequence>
        Relationships: []
      }
      invoices: {
        Row: Invoice
        Insert: Omit<Invoice, 'id' | 'invoice_number' | 'created_at' | 'updated_at' | 'bill_to_email' | 'bill_to_address' | 'paid_date' | 'paid_amount' | 'payment_method' | 'notes' | 'pdf_url'> & {
          id?: string
          invoice_number?: string
          bill_to_email?: string | null
          bill_to_address?: string | null
          paid_date?: string | null
          paid_amount?: number | null
          payment_method?: string | null
          notes?: string | null
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Invoice, 'id' | 'invoice_number' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      invoice_number_sequences: {
        Row: InvoiceNumberSequence
        Insert: InvoiceNumberSequence
        Update: Partial<InvoiceNumberSequence>
        Relationships: []
      }
      marie_queries: {
        Row: MarieQuery
        Insert: Omit<MarieQuery, 'id' | 'created_at' | 'response_text' | 'query_type' | 'tokens_used' | 'latency_ms' | 'model' | 'success' | 'error_message'> & {
          id?: string
          created_at?: string
          response_text?: string | null
          query_type?: string | null
          tokens_used?: number | null
          latency_ms?: number | null
          model?: string | null
          success?: boolean
          error_message?: string | null
        }
        Update: Partial<Omit<MarieQuery, 'id' | 'created_at'>>
        Relationships: []
      }
      daily_snapshots: {
        Row: DailySnapshot
        Insert: Omit<DailySnapshot, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<DailySnapshot, 'id' | 'created_at'>>
        Relationships: []
      }
      push_subscriptions: {
        Row: PushSubscription
        Insert: Omit<PushSubscription, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<PushSubscription, 'id' | 'created_at'>>
        Relationships: []
      }
      proactive_alerts: {
        Row: ProactiveAlert
        Insert: Omit<ProactiveAlert, 'id' | 'created_at' | 'acknowledged' | 'acknowledged_by' | 'related_entity_type' | 'related_entity_id'> & {
          id?: string
          created_at?: string
          related_entity_type?: string | null
          related_entity_id?: string | null
          acknowledged?: boolean
          acknowledged_by?: string | null
        }
        Update: Partial<Omit<ProactiveAlert, 'id' | 'created_at'>>
        Relationships: []
      }
      compliance_profiles: {
        Row: ComplianceProfile
        Insert: Omit<ComplianceProfile, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<ComplianceProfile, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      compliance_items: {
        Row: ComplianceItem
        Insert: Omit<ComplianceItem, 'id' | 'created_at' | 'updated_at' | 'completed_date' | 'description' | 'assigned_to' | 'vehicle_id' | 'driver_id' | 'document_urls' | 'notes' | 'recurrence_rule' | 'recurrence_months'> & {
          id?: string
          created_at?: string
          updated_at?: string
          completed_date?: string | null
          description?: string | null
          assigned_to?: string | null
          vehicle_id?: string | null
          driver_id?: string | null
          document_urls?: string[] | null
          notes?: string | null
          recurrence_rule?: RecurrenceRule | null
          recurrence_months?: number | null
        }
        Update: Partial<Omit<ComplianceItem, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      compliance_alerts: {
        Row: ComplianceAlert
        Insert: Omit<ComplianceAlert, 'id' | 'created_at' | 'acknowledged' | 'acknowledged_by' | 'acknowledged_at' | 'notification_sent' | 'days_until_due'> & {
          id?: string
          created_at?: string
          acknowledged?: boolean
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          notification_sent?: boolean
          days_until_due?: number | null
        }
        Update: Partial<Omit<ComplianceAlert, 'id' | 'created_at'>>
        Relationships: []
      }
      driver_qualifications: {
        Row: DriverQualification
        Insert: Omit<DriverQualification, 'id' | 'created_at' | 'updated_at' | 'dq_file_complete' | 'missing_documents'> & {
          id?: string
          created_at?: string
          updated_at?: string
          dq_file_complete?: boolean
          missing_documents?: string[] | null
          cdl_number?: string | null
          cdl_state?: string | null
          cdl_class?: CdlClass | null
          cdl_expiry?: string | null
          medical_card_expiry?: string | null
          endorsements?: string[] | null
          restrictions?: string[] | null
          mvr_last_pulled?: string | null
          mvr_status?: string | null
          drug_test_last_date?: string | null
          drug_test_result?: string | null
          annual_review_date?: string | null
          road_test_date?: string | null
          application_date?: string | null
          hire_date?: string | null
          termination_date?: string | null
        }
        Update: Partial<Omit<DriverQualification, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      inspections: {
        Row: Inspection
        Insert: Omit<Inspection, 'id' | 'created_at' | 'inspector_name' | 'expiry_date' | 'result' | 'defects_found' | 'defects_corrected' | 'document_urls' | 'notes'> & {
          id?: string
          created_at?: string
          inspector_name?: string | null
          expiry_date?: string | null
          result?: InspectionResult | null
          defects_found?: string[] | null
          defects_corrected?: string[] | null
          document_urls?: string[] | null
          notes?: string | null
        }
        Update: Partial<Omit<Inspection, 'id' | 'created_at'>>
        Relationships: []
      }
      ifta_records: {
        Row: IFTARecord
        Insert: Omit<IFTARecord, 'id' | 'created_at' | 'tax_rate' | 'tax_owed' | 'tax_paid' | 'net_tax'> & {
          id?: string
          created_at?: string
          tax_rate?: number | null
          tax_owed?: number | null
          tax_paid?: number | null
          net_tax?: number | null
        }
        Update: Partial<Omit<IFTARecord, 'id' | 'created_at'>>
        Relationships: []
      }
      maintenance_records: {
        Row: MaintenanceRecord
        Insert: Omit<MaintenanceRecord, 'id' | 'created_at' | 'updated_at' | 'downtime_days' | 'vendor_name' | 'vendor_location' | 'odometer_at_service' | 'cost_parts' | 'cost_labor' | 'cost_total' | 'warranty_covered' | 'date_out' | 'document_urls' | 'next_service_odometer' | 'next_service_date'> & {
          id?: string
          created_at?: string
          updated_at?: string
          vendor_name?: string | null
          vendor_location?: string | null
          odometer_at_service?: number | null
          cost_parts?: number
          cost_labor?: number
          cost_total?: number
          warranty_covered?: boolean
          date_out?: string | null
          document_urls?: string[] | null
          next_service_odometer?: number | null
          next_service_date?: string | null
        }
        Update: Partial<Omit<MaintenanceRecord, 'id' | 'created_at' | 'downtime_days'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      maintenance_schedules: {
        Row: MaintenanceSchedule
        Insert: Omit<MaintenanceSchedule, 'id' | 'created_at' | 'updated_at' | 'vehicle_id' | 'vehicle_class' | 'interval_miles' | 'interval_days' | 'description' | 'estimated_cost' | 'priority' | 'active'> & {
          id?: string
          created_at?: string
          updated_at?: string
          vehicle_id?: string | null
          vehicle_class?: VehicleClass | null
          interval_miles?: number | null
          interval_days?: number | null
          description?: string | null
          estimated_cost?: number | null
          priority?: MaintenancePriority
          active?: boolean
        }
        Update: Partial<Omit<MaintenanceSchedule, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      fuel_transactions: {
        Row: FuelTransaction
        Insert: Omit<FuelTransaction, 'id' | 'created_at' | 'driver_id' | 'location' | 'city' | 'state' | 'price_per_gallon' | 'odometer_reading' | 'receipt_url' | 'source'> & {
          id?: string
          created_at?: string
          driver_id?: string | null
          location?: string | null
          city?: string | null
          state?: string | null
          price_per_gallon?: number | null
          odometer_reading?: number | null
          receipt_url?: string | null
          source?: FuelSource
        }
        Update: Partial<Omit<FuelTransaction, 'id' | 'created_at'>>
        Relationships: []
      }
      vehicle_assignments: {
        Row: VehicleAssignment
        Insert: Omit<VehicleAssignment, 'id' | 'created_at' | 'assigned_at' | 'unassigned_at' | 'reason'> & {
          id?: string
          created_at?: string
          assigned_at?: string
          unassigned_at?: string | null
          reason?: string | null
        }
        Update: Partial<Omit<VehicleAssignment, 'id' | 'created_at'>>
        Relationships: []
      }
      crm_companies: {
        Row: CrmCompany
        Insert: Omit<CrmCompany, 'id' | 'created_at' | 'updated_at' | 'total_revenue' | 'total_loads' | 'avg_rate_per_mile' | 'last_load_date' | 'tags'> & {
          id?: string
          created_at?: string
          updated_at?: string
          total_revenue?: number
          total_loads?: number
          avg_rate_per_mile?: number | null
          last_load_date?: string | null
          tags?: string[]
          mc_number?: string | null
          dot_number?: string | null
          credit_score?: number | null
          days_to_pay?: number | null
          payment_terms?: string | null
          factoring_company?: string | null
          primary_contact_name?: string | null
          primary_contact_email?: string | null
          primary_contact_phone?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          website?: string | null
          notes?: string | null
        }
        Update: Partial<Omit<CrmCompany, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      crm_contacts: {
        Row: CrmContact
        Insert: Omit<CrmContact, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string | null
          email?: string | null
          phone?: string | null
          is_primary?: boolean
          notes?: string | null
        }
        Update: Partial<Omit<CrmContact, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      crm_lanes: {
        Row: CrmLane
        Insert: Omit<CrmLane, 'id' | 'created_at' | 'updated_at' | 'total_runs' | 'avg_rate_per_mile' | 'last_rate' | 'last_run_date'> & {
          id?: string
          created_at?: string
          updated_at?: string
          total_runs?: number
          origin_zip?: string | null
          destination_zip?: string | null
          distance_miles?: number | null
          avg_rate_per_mile?: number | null
          last_rate?: number | null
          last_run_date?: string | null
          preferred_equipment?: string[] | null
          notes?: string | null
        }
        Update: Partial<Omit<CrmLane, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      crm_lane_companies: {
        Row: CrmLaneCompany
        Insert: Omit<CrmLaneCompany, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
          contracted_rate?: number | null
          contract_start?: string | null
          contract_end?: string | null
        }
        Update: Partial<Omit<CrmLaneCompany, 'id' | 'created_at'>>
        Relationships: []
      }
      crm_rate_agreements: {
        Row: CrmRateAgreement
        Insert: Omit<CrmRateAgreement, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
          lane_id?: string | null
          expiry_date?: string | null
          min_volume?: number | null
          equipment_type?: string | null
          document_url?: string | null
        }
        Update: Partial<Omit<CrmRateAgreement, 'id' | 'created_at'>>
        Relationships: []
      }
      crm_activities: {
        Row: CrmActivity
        Insert: Omit<CrmActivity, 'id' | 'created_at' | 'completed_at'> & {
          id?: string
          created_at?: string
          company_id?: string | null
          contact_id?: string | null
          lane_id?: string | null
          subject?: string | null
          body?: string | null
          scheduled_at?: string | null
          completed_at?: string | null
          outcome?: string | null
          follow_up_date?: string | null
        }
        Update: Partial<Omit<CrmActivity, 'id' | 'created_at'>>
        Relationships: []
      }
      billing_accounts: {
        Row: BillingAccount
        Insert: Omit<BillingAccount, 'id' | 'created_at' | 'updated_at' | 'stripe_customer_id' | 'stripe_subscription_id' | 'monthly_rate' | 'annual_rate' | 'trial_ends_at' | 'current_period_start' | 'current_period_end' | 'payment_method_last4' | 'payment_method_brand' | 'cancellation_reason' | 'canceled_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          monthly_rate?: number | null
          annual_rate?: number | null
          trial_ends_at?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          payment_method_last4?: string | null
          payment_method_brand?: string | null
          cancellation_reason?: string | null
          canceled_at?: string | null
        }
        Update: Partial<Omit<BillingAccount, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      plan_limits: {
        Row: PlanLimits
        Insert: Omit<PlanLimits, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<PlanLimits, 'id' | 'created_at'>>
        Relationships: []
      }
      usage_records: {
        Row: UsageRecord
        Insert: Omit<UsageRecord, 'id' | 'created_at' | 'updated_at' | 'vehicles_count' | 'drivers_count' | 'loads_count' | 'users_count' | 'ai_queries_count' | 'voice_minutes_used'> & {
          id?: string
          created_at?: string
          updated_at?: string
          vehicles_count?: number
          drivers_count?: number
          loads_count?: number
          users_count?: number
          ai_queries_count?: number
          voice_minutes_used?: number
        }
        Update: Partial<Omit<UsageRecord, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      billing_invoices: {
        Row: BillingInvoice
        Insert: Omit<BillingInvoice, 'id' | 'created_at' | 'stripe_invoice_id' | 'tax' | 'period_start' | 'period_end' | 'due_date' | 'paid_at' | 'pdf_url'> & {
          id?: string
          created_at?: string
          stripe_invoice_id?: string | null
          tax?: number
          period_start?: string | null
          period_end?: string | null
          due_date?: string | null
          paid_at?: string | null
          pdf_url?: string | null
        }
        Update: Partial<Omit<BillingInvoice, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      company_type: CompanyType
      user_role: UserRole
    }
  }
}
