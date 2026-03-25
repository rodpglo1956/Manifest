import { z } from 'zod'

export const maintenanceRecordSchema = z.object({
  vehicle_id: z.string().uuid('Invalid vehicle ID'),
  maintenance_type: z.enum([
    'oil_change', 'tire_rotation', 'tire_replacement', 'brake_service',
    'transmission', 'engine', 'electrical', 'hvac', 'body_work',
    'dot_inspection', 'preventive', 'recall', 'roadside_repair',
    'scheduled_service', 'unscheduled_repair', 'other',
  ]),
  description: z.string().min(1, 'Description is required'),
  vendor_name: z.string().optional(),
  vendor_location: z.string().optional(),
  odometer_at_service: z.coerce.number().int().nonnegative().optional(),
  cost_parts: z.coerce.number().nonnegative().default(0),
  cost_labor: z.coerce.number().nonnegative().default(0),
  cost_total: z.coerce.number().nonnegative().default(0),
  warranty_covered: z.boolean().default(false),
  date_in: z.string().min(1, 'Date in is required'),
  date_out: z.string().optional(),
  document_urls: z.array(z.string()).optional(),
  next_service_odometer: z.coerce.number().int().nonnegative().optional(),
  next_service_date: z.string().optional(),
})

export type MaintenanceRecordInput = z.input<typeof maintenanceRecordSchema>

export const maintenanceScheduleSchema = z.object({
  vehicle_id: z.string().uuid().optional(),
  vehicle_class: z.enum([
    'class_1_2', 'class_3_4', 'class_5_6', 'class_7', 'class_8', 'trailer', 'other',
  ]).optional(),
  maintenance_type: z.enum([
    'oil_change', 'tire_rotation', 'tire_replacement', 'brake_service',
    'transmission', 'engine', 'electrical', 'hvac', 'body_work',
    'dot_inspection', 'preventive', 'recall', 'roadside_repair',
    'scheduled_service', 'unscheduled_repair', 'other',
  ]),
  interval_miles: z.coerce.number().int().positive().optional(),
  interval_days: z.coerce.number().int().positive().optional(),
  description: z.string().optional(),
  estimated_cost: z.coerce.number().nonnegative().optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  active: z.boolean().default(true),
}).refine(
  (data) => data.interval_miles !== undefined || data.interval_days !== undefined,
  { message: 'At least one of interval_miles or interval_days must be provided' }
)

export type MaintenanceScheduleInput = z.input<typeof maintenanceScheduleSchema>

export const fuelTransactionSchema = z.object({
  vehicle_id: z.string().uuid('Invalid vehicle ID'),
  driver_id: z.string().uuid().optional(),
  transaction_date: z.string().min(1, 'Transaction date is required'),
  location: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  gallons: z.coerce.number().positive('Gallons must be greater than 0'),
  price_per_gallon: z.coerce.number().positive().optional(),
  total_cost: z.coerce.number().positive('Total cost must be greater than 0'),
  odometer_reading: z.coerce.number().int().nonnegative().optional(),
  source: z.enum(['manual', 'fuel_card', 'eld', 'receipt_scan']).default('manual'),
})

export type FuelTransactionInput = z.input<typeof fuelTransactionSchema>

export const vehicleAssignmentSchema = z.object({
  vehicle_id: z.string().uuid('Invalid vehicle ID'),
  driver_id: z.string().uuid('Invalid driver ID'),
  reason: z.string().optional(),
})

export type VehicleAssignmentInput = z.input<typeof vehicleAssignmentSchema>
