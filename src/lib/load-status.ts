import type { LoadStatus } from '@/types/database'

// All 10 load statuses in lifecycle order
export const LOAD_STATUSES: LoadStatus[] = [
  'booked',
  'dispatched',
  'in_transit',
  'at_pickup',
  'loaded',
  'at_delivery',
  'delivered',
  'invoiced',
  'paid',
  'canceled',
]

// Status order for sorting (lower = earlier in lifecycle)
export const STATUS_ORDER: Record<LoadStatus, number> = {
  booked: 0,
  dispatched: 1,
  in_transit: 2,
  at_pickup: 3,
  loaded: 4,
  at_delivery: 5,
  delivered: 6,
  invoiced: 7,
  paid: 8,
  canceled: 9,
}

// Valid status transitions per PRD-01 lifecycle
// booked -> dispatched -> in_transit -> at_pickup -> loaded -> at_delivery -> delivered -> invoiced -> paid
// canceled is reachable from any status except paid and invoiced
export const VALID_TRANSITIONS: Record<LoadStatus, LoadStatus[]> = {
  booked: ['dispatched', 'canceled'],
  dispatched: ['in_transit', 'canceled'],
  in_transit: ['at_pickup', 'canceled'],
  at_pickup: ['loaded', 'canceled'],
  loaded: ['at_delivery', 'canceled'],
  at_delivery: ['delivered', 'canceled'],
  delivered: ['invoiced', 'canceled'],
  invoiced: ['paid'],
  paid: [],
  canceled: [],
}

/**
 * Check if a status transition is valid
 */
export function canTransition(from: LoadStatus, to: LoadStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Get Tailwind color class for a status
 */
export function getStatusColor(status: LoadStatus): string {
  switch (status) {
    case 'booked':
    case 'dispatched':
      return 'text-yellow-600 bg-yellow-50'
    case 'in_transit':
    case 'at_pickup':
    case 'loaded':
    case 'at_delivery':
      return 'text-blue-600 bg-blue-50'
    case 'delivered':
    case 'paid':
      return 'text-green-600 bg-green-50'
    case 'invoiced':
      return 'text-gray-600 bg-gray-50'
    case 'canceled':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

/**
 * Get human-readable label for a status
 */
export function getStatusLabel(status: LoadStatus): string {
  switch (status) {
    case 'booked':
      return 'Booked'
    case 'dispatched':
      return 'Dispatched'
    case 'in_transit':
      return 'In Transit'
    case 'at_pickup':
      return 'At Pickup'
    case 'loaded':
      return 'Loaded'
    case 'at_delivery':
      return 'At Delivery'
    case 'delivered':
      return 'Delivered'
    case 'invoiced':
      return 'Invoiced'
    case 'paid':
      return 'Paid'
    case 'canceled':
      return 'Canceled'
    default:
      return status
  }
}
