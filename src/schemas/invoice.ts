import { z } from 'zod'

// Invoice form validation schema
// Uses z.coerce.number() for numeric fields (matching load wizard pattern)
export const invoiceSchema = z.object({
  bill_to_company: z.string().min(1, 'Bill-to company is required'),
  bill_to_email: z.union([z.string().email('Please enter a valid email'), z.literal('')]).optional().default(''),
  bill_to_address: z.string().optional().default(''),
  amount: z.coerce.number().min(0, 'Amount must be non-negative'),
  fuel_surcharge: z.coerce.number().min(0, 'Fuel surcharge must be non-negative').optional().default(0),
  accessorials: z.coerce.number().min(0, 'Accessorials must be non-negative').optional().default(0),
  total: z.coerce.number().min(0, 'Total must be non-negative'),
  issued_date: z.string().min(1, 'Issued date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  notes: z.string().optional().default(''),
  payment_method: z.string().optional().default(''),
})

// Use z.input per project convention (zodResolver compatibility)
export type InvoiceInput = z.input<typeof invoiceSchema>
