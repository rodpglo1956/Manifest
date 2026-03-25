import { z } from 'zod'

export const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  role: z.enum(['admin', 'dispatcher', 'driver', 'viewer'], {
    error: 'Please select a valid role',
  }),
})

export type InviteInput = z.infer<typeof inviteSchema>
