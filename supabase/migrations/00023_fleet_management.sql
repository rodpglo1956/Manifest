-- Phase 8: Fleet Management tables
-- Expands vehicles table, adds maintenance_records, maintenance_schedules,
-- fuel_transactions, vehicle_assignments
-- All with RLS org isolation using (select auth.org_id()) pattern

-- ============================================================
-- ALTER vehicles table: expand enums and add new columns
-- ============================================================

-- Drop existing CHECK constraints on vehicle_type and status
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_vehicle_type_check;
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_status_check;

-- Re-add expanded vehicle_type CHECK
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_vehicle_type_check
  CHECK (vehicle_type IN (
    'dry_van', 'reefer', 'flatbed', 'sprinter', 'box_truck',
    'medical_van', 'hotshot', 'straight_truck', 'day_cab', 'sleeper',
    'tanker', 'dry_van_trailer', 'flatbed_trailer', 'reefer_trailer',
    'step_deck_trailer', 'other'
  ));

-- Re-add expanded status CHECK
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_status_check
  CHECK (status IN ('active', 'in_shop', 'out_of_service', 'parked', 'sold', 'totaled'));

-- Add new columns
ALTER TABLE public.vehicles ADD COLUMN vehicle_class text NOT NULL DEFAULT 'other'
  CHECK (vehicle_class IN ('class_1_2', 'class_3_4', 'class_5_6', 'class_7', 'class_8', 'trailer', 'other'));

ALTER TABLE public.vehicles ADD COLUMN fuel_type text DEFAULT 'diesel'
  CHECK (fuel_type IN ('diesel', 'gasoline', 'cng', 'electric', 'hybrid'));

ALTER TABLE public.vehicles ADD COLUMN license_plate text;
ALTER TABLE public.vehicles ADD COLUMN license_state text;
ALTER TABLE public.vehicles ADD COLUMN registration_expiry date;
ALTER TABLE public.vehicles ADD COLUMN current_odometer integer;
ALTER TABLE public.vehicles ADD COLUMN odometer_updated_at timestamptz;
ALTER TABLE public.vehicles ADD COLUMN avg_mpg numeric(5,2);
ALTER TABLE public.vehicles ADD COLUMN purchase_date date;
ALTER TABLE public.vehicles ADD COLUMN purchase_price numeric(12,2);
ALTER TABLE public.vehicles ADD COLUMN current_value numeric(12,2);
ALTER TABLE public.vehicles ADD COLUMN insurance_policy text;
ALTER TABLE public.vehicles ADD COLUMN gps_device_id text;
ALTER TABLE public.vehicles ADD COLUMN eld_provider text;
ALTER TABLE public.vehicles ADD COLUMN eld_device_id text;
ALTER TABLE public.vehicles ADD COLUMN photo_urls text[];
ALTER TABLE public.vehicles ADD COLUMN notes text;
ALTER TABLE public.vehicles ADD COLUMN current_driver_id uuid REFERENCES public.drivers(id);

-- ============================================================
-- maintenance_records: PRD 3.2
-- ============================================================
CREATE TABLE public.maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id),
  maintenance_type text NOT NULL CHECK (maintenance_type IN (
    'oil_change', 'tire_rotation', 'tire_replacement', 'brake_service',
    'transmission', 'engine', 'electrical', 'hvac', 'body_work',
    'dot_inspection', 'preventive', 'recall', 'roadside_repair',
    'scheduled_service', 'unscheduled_repair', 'other'
  )),
  description text NOT NULL,
  vendor_name text,
  vendor_location text,
  odometer_at_service integer,
  cost_parts numeric(10,2) DEFAULT 0,
  cost_labor numeric(10,2) DEFAULT 0,
  cost_total numeric(10,2) DEFAULT 0,
  warranty_covered boolean DEFAULT false,
  date_in date NOT NULL,
  date_out date,
  downtime_days integer GENERATED ALWAYS AS (
    CASE WHEN date_out IS NOT NULL AND date_in IS NOT NULL
      THEN (date_out - date_in)
      ELSE NULL
    END
  ) STORED,
  document_urls text[],
  next_service_odometer integer,
  next_service_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- maintenance_schedules: PRD 3.2 (templates for recurring maintenance)
-- ============================================================
CREATE TABLE public.maintenance_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  vehicle_id uuid REFERENCES public.vehicles(id), -- null = org-wide
  vehicle_class text CHECK (vehicle_class IS NULL OR vehicle_class IN (
    'class_1_2', 'class_3_4', 'class_5_6', 'class_7', 'class_8', 'trailer', 'other'
  )),
  maintenance_type text NOT NULL CHECK (maintenance_type IN (
    'oil_change', 'tire_rotation', 'tire_replacement', 'brake_service',
    'transmission', 'engine', 'electrical', 'hvac', 'body_work',
    'dot_inspection', 'preventive', 'recall', 'roadside_repair',
    'scheduled_service', 'unscheduled_repair', 'other'
  )),
  interval_miles integer,
  interval_days integer,
  description text,
  estimated_cost numeric(10,2),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- fuel_transactions: PRD 3.2
-- ============================================================
CREATE TABLE public.fuel_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id),
  driver_id uuid REFERENCES public.drivers(id),
  transaction_date date NOT NULL,
  location text,
  city text,
  state text,
  gallons numeric(10,3) NOT NULL CHECK (gallons > 0),
  price_per_gallon numeric(8,4),
  total_cost numeric(10,2) NOT NULL CHECK (total_cost > 0),
  odometer_reading integer,
  receipt_url text,
  source text DEFAULT 'manual' CHECK (source IN ('manual', 'fuel_card', 'eld', 'receipt_scan')),
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- vehicle_assignments: PRD 3.2
-- ============================================================
CREATE TABLE public.vehicle_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id),
  driver_id uuid NOT NULL REFERENCES public.drivers(id),
  assigned_at timestamptz DEFAULT now(),
  unassigned_at timestamptz,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- RLS policies
-- ============================================================
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON public.maintenance_records
  FOR ALL USING (org_id = (SELECT auth.org_id()));
CREATE POLICY "org_isolation" ON public.maintenance_schedules
  FOR ALL USING (org_id = (SELECT auth.org_id()));
CREATE POLICY "org_isolation" ON public.fuel_transactions
  FOR ALL USING (org_id = (SELECT auth.org_id()));
CREATE POLICY "org_isolation" ON public.vehicle_assignments
  FOR ALL USING (org_id = (SELECT auth.org_id()));

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_maintenance_records_org_vehicle ON public.maintenance_records(org_id, vehicle_id);
CREATE INDEX idx_maintenance_records_date ON public.maintenance_records(date_in);
CREATE INDEX idx_maintenance_schedules_org ON public.maintenance_schedules(org_id);
CREATE INDEX idx_fuel_transactions_org_vehicle ON public.fuel_transactions(org_id, vehicle_id);
CREATE INDEX idx_fuel_transactions_date ON public.fuel_transactions(transaction_date);
CREATE INDEX idx_vehicle_assignments_org_vehicle ON public.vehicle_assignments(org_id, vehicle_id);
CREATE INDEX idx_vehicle_assignments_driver ON public.vehicle_assignments(driver_id);
CREATE INDEX idx_vehicles_class ON public.vehicles(vehicle_class);
CREATE INDEX idx_vehicles_current_driver ON public.vehicles(current_driver_id);
