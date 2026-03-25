// Individual factor calculators for smart routing
// Each returns a normalized 0-1 score

import { isAdjacent } from './adjacency'

/**
 * Calculate proximity score based on driver's last delivery location vs load pickup.
 * Same city+state = 1.0, same state = 0.7, adjacent state = 0.4, far = 0.1
 */
export function calculateProximity(
  driverLastCity: string | null,
  driverLastState: string | null,
  pickupCity: string,
  pickupState: string
): number {
  if (!driverLastCity || !driverLastState) return 0.1

  const dCity = driverLastCity.toLowerCase()
  const dState = driverLastState.toLowerCase()
  const pCity = pickupCity.toLowerCase()
  const pState = pickupState.toLowerCase()

  if (dCity === pCity && dState === pState) return 1.0
  if (dState === pState) return 0.7
  if (isAdjacent(dState, pState)) return 0.4
  return 0.1
}

/**
 * Calculate availability score.
 * No active dispatch = 1.0, has active dispatch = 0.0
 */
export function calculateAvailability(hasActiveDispatch: boolean): number {
  return hasActiveDispatch ? 0.0 : 1.0
}

/**
 * Calculate equipment match score.
 * Match = 1.0, no load equipment requirement = 0.8, mismatch = 0.0
 */
export function calculateEquipment(
  vehicleType: string | null,
  loadEquipment: string | null
): number {
  if (!loadEquipment) return 0.8
  if (!vehicleType) return 0.0
  return vehicleType === loadEquipment ? 1.0 : 0.0
}

/**
 * Calculate on-time performance ratio.
 * Returns 0.5 default if no deliveries (benefit of the doubt).
 */
export function calculatePerformance(
  onTimeCount: number,
  totalDeliveries: number
): number {
  if (totalDeliveries === 0) return 0.5
  return Math.min(onTimeCount / totalDeliveries, 1.0)
}

/**
 * Calculate lane familiarity based on previous runs on same route.
 * Normalized as min(count/5, 1.0).
 */
export function calculateLaneFamiliarity(previousRunCount: number): number {
  return Math.min(previousRunCount / 5, 1.0)
}
