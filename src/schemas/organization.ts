import { z } from 'zod'

export const organizationSchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255),
  address_line1: z.string().default(''),
  address_city: z.string().default(''),
  address_state: z.string().max(2).default(''),
  address_zip: z.string().max(10).default(''),
  phone: z.string().default(''),
  email: z.union([z.string().email(), z.literal('')]).default(''),
  dot_number: z.string().max(20).default(''),
  mc_number: z.string().max(20).default(''),
  company_type: z.enum(['dot_carrier', 'non_dot_carrier', 'both']),
})

export type OrganizationInput = z.input<typeof organizationSchema>
export type OrganizationOutput = z.output<typeof organizationSchema>
