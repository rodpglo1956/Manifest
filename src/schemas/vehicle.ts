import { z } from 'zod'

export const vehicleSchema = z.object({
  unit_number: z.string().min(1, 'Unit number is required'),
  vin: z
    .union([z.string().length(17, 'VIN must be 17 characters'), z.literal('')])
    .optional()
    .default(''),
  year: z.coerce
    .number()
    .int()
    .min(1900, 'Year must be 1900 or later')
    .max(2100, 'Year must be 2100 or earlier'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  vehicle_type: z.enum([
    'dry_van', 'reefer', 'flatbed', 'sprinter', 'box_truck',
    'medical_van', 'hotshot', 'straight_truck', 'day_cab', 'sleeper',
    'tanker', 'dry_van_trailer', 'flatbed_trailer', 'reefer_trailer',
    'step_deck_trailer', 'other',
  ]),
  vehicle_class: z.enum([
    'class_1_2', 'class_3_4', 'class_5_6', 'class_7', 'class_8', 'trailer', 'other',
  ]).default('other'),
  fuel_type: z.enum(['diesel', 'gasoline', 'cng', 'electric', 'hybrid']).optional().default('diesel'),
  status: z.enum(['active', 'in_shop', 'out_of_service', 'parked', 'sold', 'totaled']).default('active'),
  license_plate: z.string().optional(),
  license_state: z.string().optional(),
  registration_expiry: z.string().optional(),
  current_odometer: z.coerce.number().int().nonnegative().optional(),
  avg_mpg: z.coerce.number().nonnegative().optional(),
  purchase_date: z.string().optional(),
  purchase_price: z.coerce.number().nonnegative().optional(),
  current_value: z.coerce.number().nonnegative().optional(),
  insurance_policy: z.string().optional(),
  notes: z.string().optional(),
})

export type VehicleInput = z.input<typeof vehicleSchema>
