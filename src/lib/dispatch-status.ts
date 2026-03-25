import type { DispatchStatus } from '@/types/database'

// All 8 dispatch statuses in lifecycle order
export const DISPATCH_STATUSES: DispatchStatus[] = [
  'assigned',
  'accepted',
  'en_route_pickup',
  'at_pickup',
  'en_route_delivery',
  'at_delivery',
  'completed',
  'rejected',
]

// Valid status transitions for dispatch lifecycle
// assigned -> accepted or rejected (driver choice)
// accepted -> en_route_pickup -> at_pickup -> en_route_delivery -> at_delivery -> completed
// completed and rejected are terminal states
export const VALID_DISPATCH_TRANSITIONS: Record<DispatchStatus, DispatchStatus[]> = {
  assigned: ['accepted', 'rejected'],
  accepted: ['en_route_pickup'],
  en_route_pickup: ['at_pickup'],
  at_pickup: ['en_route_delivery'],
  en_route_delivery: ['at_delivery'],
  at_delivery: ['completed'],
  completed: [],
  rejected: [],
}

/**
 * Check if a dispatch status transition is valid
 */
export function canDispatchTransition(from: DispatchStatus, to: DispatchStatus): boolean {
  return VALID_DISPATCH_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Get human-readable label for a dispatch status
 */
export function getDispatchStatusLabel(status: DispatchStatus): string {
  switch (status) {
    case 'assigned':
      return 'Assigned'
    case 'accepted':
      return 'Accepted'
    case 'en_route_pickup':
      return 'En Route Pickup'
    case 'at_pickup':
      return 'At Pickup'
    case 'en_route_delivery':
      return 'En Route Delivery'
    case 'at_delivery':
      return 'At Delivery'
    case 'completed':
      return 'Completed'
    case 'rejected':
      return 'Rejected'
    default:
      return status
  }
}

/**
 * Get Tailwind color class for a dispatch status
 */
export function getDispatchStatusColor(status: DispatchStatus): string {
  switch (status) {
    case 'assigned':
      return 'text-yellow-600 bg-yellow-50'
    case 'accepted':
      return 'text-blue-600 bg-blue-50'
    case 'en_route_pickup':
      return 'text-indigo-600 bg-indigo-50'
    case 'at_pickup':
      return 'text-cyan-600 bg-cyan-50'
    case 'en_route_delivery':
      return 'text-purple-600 bg-purple-50'
    case 'at_delivery':
      return 'text-amber-600 bg-amber-50'
    case 'completed':
      return 'text-green-600 bg-green-50'
    case 'rejected':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}
