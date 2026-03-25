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
  vehicle_type: z.enum(['dry_van', 'reefer', 'flatbed', 'sprinter', 'box_truck', 'other']),
  status: z.enum(['active', 'inactive']).default('active'),
})

export type VehicleInput = z.input<typeof vehicleSchema>
