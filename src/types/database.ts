// TypeScript types for Supabase database tables
// Matches PRD-01 Section 2.3 schema exactly
// Note: RLS policies use (select auth.uid()) and (select auth.org_id()) patterns

export type CompanyType = 'dot_carrier' | 'non_dot_carrier' | 'both'

export type UserRole = 'admin' | 'dispatcher' | 'driver' | 'viewer'

// Phase 2: Driver, Vehicle, Load types
export type DriverStatus = 'active' | 'inactive' | 'terminated'

export type VehicleType = 'dry_van' | 'reefer' | 'flatbed' | 'sprinter' | 'box_truck' | 'other'

export type VehicleStatus = 'active' | 'inactive'

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
  status: VehicleStatus
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
        Insert: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      company_type: CompanyType
      user_role: UserRole
    }
  }
}
