// Marie tool definitions and executor
// Defines Claude tool_use tools for Marie AI assistant

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, UserRole } from '@/types/database'
import {
  createLoadForMarie,
  createDispatchForMarie,
  createInvoiceForMarie,
} from './actions'

// Tool type compatible with Anthropic SDK
type MarieTool = {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required: string[]
  }
}

export const marieTools: MarieTool[] = [
  {
    name: 'create_load',
    description:
      'Create a new load in the system. Use when the user asks to create, add, or book a new load.',
    input_schema: {
      type: 'object' as const,
      properties: {
        pickup_city: {
          type: 'string',
          description: 'Pickup city name',
        },
        pickup_state: {
          type: 'string',
          description: 'Pickup state abbreviation (e.g., TX)',
        },
        delivery_city: {
          type: 'string',
          description: 'Delivery city name',
        },
        delivery_state: {
          type: 'string',
          description: 'Delivery state abbreviation (e.g., TX)',
        },
        equipment_type: {
          type: 'string',
          enum: ['dry_van', 'reefer', 'flatbed', 'sprinter', 'box_truck'],
          description: 'Required equipment type',
        },
        rate_amount: {
          type: 'number',
          description: 'Rate amount in dollars',
        },
        rate_type: {
          type: 'string',
          enum: ['flat', 'per_mile'],
          description: 'Rate type (defaults to flat)',
        },
      },
      required: [
        'pickup_city',
        'pickup_state',
        'delivery_city',
        'delivery_state',
        'rate_amount',
      ],
    },
  },
  {
    name: 'dispatch_driver',
    description:
      'Dispatch a driver to a load. Use when the user asks to assign, dispatch, or send a driver to a load.',
    input_schema: {
      type: 'object' as const,
      properties: {
        load_id: {
          type: 'string',
          description: 'The UUID of the load to dispatch',
        },
        driver_id: {
          type: 'string',
          description: 'The UUID of the driver to assign',
        },
      },
      required: ['load_id', 'driver_id'],
    },
  },
  {
    name: 'generate_invoice',
    description:
      'Generate an invoice for a delivered load. Use when the user asks to create an invoice, bill, or invoice a load.',
    input_schema: {
      type: 'object' as const,
      properties: {
        load_id: {
          type: 'string',
          description: 'The UUID of the delivered load to invoice',
        },
      },
      required: ['load_id'],
    },
  },
]

/**
 * Get tools available for a given user role.
 * Drivers and viewers get no action tools.
 */
export function getMarieTools(role: UserRole): MarieTool[] {
  if (role === 'driver' || role === 'viewer') {
    return []
  }
  return marieTools
}

/**
 * Execute a tool by name, dispatching to the correct action wrapper.
 */
export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  supabase: SupabaseClient<Database>,
  orgId: string,
  userId: string
): Promise<Record<string, unknown>> {
  switch (name) {
    case 'create_load':
      return createLoadForMarie(supabase, orgId, userId, input as never)

    case 'dispatch_driver':
      return createDispatchForMarie(supabase, orgId, userId, input as never)

    case 'generate_invoice':
      return createInvoiceForMarie(supabase, input as never)

    default:
      return { error: `Unknown tool: ${name}` }
  }
}
