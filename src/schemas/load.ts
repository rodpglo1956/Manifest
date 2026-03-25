import { z } from 'zod'

// Per-step schemas for multi-step load form wizard
// Each step can be validated independently via trigger() validation

export const pickupSchema = z.object({
  pickup_company: z.string().min(1, 'Pickup company is required'),
  pickup_address: z.string().min(1, 'Pickup address is required'),
  pickup_city: z.string().min(1, 'Pickup city is required'),
  pickup_state: z.string().length(2, 'State must be 2 characters'),
  pickup_zip: z.string().min(5, 'Zip code is required'),
  pickup_date: z.string().min(1, 'Pickup date is required'),
  pickup_time: z.string().optional().default(''),
  pickup_contact_name: z.string().optional().default(''),
  pickup_contact_phone: z.string().optional().default(''),
  pickup_reference: z.string().optional().default(''),
  pickup_notes: z.string().optional().default(''),
})

export const deliverySchema = z.object({
  delivery_company: z.string().min(1, 'Delivery company is required'),
  delivery_address: z.string().min(1, 'Delivery address is required'),
  delivery_city: z.string().min(1, 'Delivery city is required'),
  delivery_state: z.string().length(2, 'State must be 2 characters'),
  delivery_zip: z.string().min(5, 'Zip code is required'),
  delivery_date: z.string().min(1, 'Delivery date is required'),
  delivery_time: z.string().optional().default(''),
  delivery_contact_name: z.string().optional().default(''),
  delivery_contact_phone: z.string().optional().default(''),
  delivery_reference: z.string().optional().default(''),
  delivery_notes: z.string().optional().default(''),
})

export const freightSchema = z.object({
  commodity: z.string().min(1, 'Commodity is required'),
  weight: z.coerce.number().positive('Weight must be positive').optional(),
  weight_unit: z.enum(['lbs', 'kg']).default('lbs'),
  pieces: z.coerce.number().int().positive('Pieces must be positive').optional(),
  equipment_type: z.enum([
    'dry_van', 'reefer', 'flatbed', 'sprinter', 'box_truck',
    'medical_van', 'hotshot', 'straight_truck', 'day_cab', 'sleeper',
    'tanker', 'dry_van_trailer', 'flatbed_trailer', 'reefer_trailer',
    'step_deck_trailer', 'other',
  ]),
  temperature_min: z.coerce.number().optional(),
  temperature_max: z.coerce.number().optional(),
  hazmat: z.boolean().default(false),
})

export const rateSchema = z.object({
  rate_amount: z.coerce.number().positive('Rate must be positive'),
  rate_type: z.enum(['flat', 'per_mile', 'hourly', 'per_stop']).default('flat'),
  miles: z.coerce.number().positive('Miles must be positive').optional(),
  fuel_surcharge: z.coerce.number().min(0).optional(),
  accessorial_charges: z.coerce.number().min(0).optional(),
  total_charges: z.coerce.number().min(0).optional(),
})

export const brokerSchema = z.object({
  broker_name: z.string().optional().default(''),
  broker_contact: z.string().optional().default(''),
  broker_phone: z.string().optional().default(''),
  broker_email: z.union([z.string().email('Please enter a valid email'), z.literal('')]).optional().default(''),
  broker_mc_number: z.string().optional().default(''),
  broker_reference: z.string().optional().default(''),
})

export const assignmentSchema = z.object({
  driver_id: z.string().uuid().optional(),
  vehicle_id: z.string().uuid().optional(),
})

// Combined load schema for full form validation on submit
export const loadSchema = pickupSchema
  .merge(deliverySchema)
  .merge(freightSchema)
  .merge(rateSchema)
  .merge(brokerSchema)
  .merge(assignmentSchema)
  .extend({
    load_number: z.string().optional(),
    notes: z.string().optional().default(''),
  })

// Step field arrays for wizard trigger() validation
export const STEP_FIELDS = {
  pickup: Object.keys(pickupSchema.shape) as (keyof z.infer<typeof pickupSchema>)[],
  delivery: Object.keys(deliverySchema.shape) as (keyof z.infer<typeof deliverySchema>)[],
  freight: Object.keys(freightSchema.shape) as (keyof z.infer<typeof freightSchema>)[],
  rate: Object.keys(rateSchema.shape) as (keyof z.infer<typeof rateSchema>)[],
  broker: Object.keys(brokerSchema.shape) as (keyof z.infer<typeof brokerSchema>)[],
  assignment: Object.keys(assignmentSchema.shape) as (keyof z.infer<typeof assignmentSchema>)[],
} as const

export type LoadInput = z.input<typeof loadSchema>
