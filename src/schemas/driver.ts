import { z } from 'zod'

export const driverSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.union([z.string().email('Please enter a valid email'), z.literal('')]).optional(),
  phone: z.string().min(1, 'Phone number is required'),
  license_number: z.string().optional().default(''),
  license_state: z
    .union([z.string().length(2, 'State must be 2 characters'), z.literal('')])
    .optional()
    .default(''),
  license_class: z.enum(['A', 'B', 'C', 'standard']).optional(),
  license_expiration: z.string().optional().default(''),
  hire_date: z.string().optional().default(''),
  status: z.enum(['active', 'inactive', 'terminated']).default('active'),
  home_terminal: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  emergency_contact_name: z.string().optional().default(''),
  emergency_contact_phone: z.string().optional().default(''),
})

export const driverUpdateSchema = driverSchema.partial()

export type DriverInput = z.input<typeof driverSchema>
