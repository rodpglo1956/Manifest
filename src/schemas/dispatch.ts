import { z } from 'zod'

export const createDispatchSchema = z.object({
  load_id: z.string().uuid('Invalid load ID'),
  driver_id: z.string().uuid('Invalid driver ID'),
  vehicle_id: z.string().uuid('Invalid vehicle ID').optional(),
  estimated_pickup_arrival: z.string().optional(),
  estimated_delivery_arrival: z.string().optional(),
  dispatcher_notes: z.string().optional().default(''),
})

export type CreateDispatchInput = z.input<typeof createDispatchSchema>

export const driverNotesSchema = z.object({
  dispatch_id: z.string().uuid('Invalid dispatch ID'),
  driver_notes: z.string().min(1, 'Notes cannot be empty').max(1000, 'Notes must be 1000 characters or less'),
})
