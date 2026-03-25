// Smart routing scoring algorithm
// Scores and ranks drivers for a given load based on 5 weighted factors

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Load } from '@/types/database'
import type { DriverSuggestion, ScoringFactors } from '@/types/marie'
import {
  calculateProximity,
  calculateAvailability,
  calculateEquipment,
  calculatePerformance,
  calculateLaneFamiliarity,
} from './factors'

export const WEIGHTS = {
  proximity: 0.30,
  availability: 0.25,
  equipment: 0.20,
  performance: 0.15,
  lane: 0.10,
}

/**
 * Calculate weighted score from factors. Returns 0-100 rounded integer.
 */
export function calculateScore(factors: ScoringFactors): number {
  return Math.round(
    factors.proximity * WEIGHTS.proximity * 100 +
    factors.availability * WEIGHTS.availability * 100 +
    factors.equipment * WEIGHTS.equipment * 100 +
    factors.performance * WEIGHTS.performance * 100 +
    factors.lane * WEIGHTS.lane * 100
  )
}

/**
 * Score all active drivers for a given load and return ranked suggestions.
 */
export async function scoreDriversForLoad(
  supabase: SupabaseClient<Database>,
  load: Load
): Promise<DriverSuggestion[]> {
  // Fetch all active drivers with their vehicle info
  const { data: drivers } = await supabase
    .from('drivers')
    .select('id, first_name, last_name, status, current_vehicle_id')
    .eq('status', 'active')

  if (!drivers || drivers.length === 0) return []

  // Fetch vehicle types for all drivers that have vehicles
  const vehicleIds = drivers
    .map((d) => d.current_vehicle_id)
    .filter((id): id is string => id !== null)

  const vehicleMap = new Map<string, string>()
  if (vehicleIds.length > 0) {
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, vehicle_type')
      .in('id', vehicleIds)

    vehicles?.forEach((v) => vehicleMap.set(v.id, v.vehicle_type))
  }

  // Fetch active dispatches (to check availability)
  const driverIds = drivers.map((d) => d.id)
  const { data: activeDispatches } = await supabase
    .from('dispatches')
    .select('driver_id')
    .in('driver_id', driverIds)
    .not('status', 'in', '("completed","rejected")')

  const busyDriverIds = new Set(
    activeDispatches?.map((d) => d.driver_id) ?? []
  )

  // For each driver, get last completed dispatch -> load for proximity
  const suggestions: DriverSuggestion[] = []

  for (const driver of drivers) {
    // Get last completed dispatch for proximity
    const { data: lastDispatch } = await supabase
      .from('dispatches')
      .select('load_id')
      .eq('driver_id', driver.id)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let lastCity: string | null = null
    let lastState: string | null = null

    if (lastDispatch?.load_id) {
      const { data: lastLoad } = await supabase
        .from('loads')
        .select('delivery_city, delivery_state')
        .eq('id', lastDispatch.load_id)
        .single()

      lastCity = lastLoad?.delivery_city ?? null
      lastState = lastLoad?.delivery_state ?? null
    }

    // If no last delivery, try home_terminal (it's a city string like "Dallas, TX")
    if (!lastCity || !lastState) {
      // Fall back to home_terminal - but we'd need to fetch the full driver record
      // For now, these remain null which gives 0.1 proximity
    }

    // Performance: count on-time deliveries from load_status_history
    // On-time = loads this driver delivered that have a 'delivered' status entry
    const { data: driverDispatches } = await supabase
      .from('dispatches')
      .select('load_id')
      .eq('driver_id', driver.id)
      .eq('status', 'completed')

    const totalDeliveries = driverDispatches?.length ?? 0

    // Count on-time: loads where delivery happened on or before delivery_date
    // Simplified: use total completed as on-time (we don't have reliable late detection yet)
    const onTimeCount = totalDeliveries

    // Lane familiarity: count previous loads on same origin-destination city pair
    let laneCount = 0
    if (load.pickup_city && load.delivery_city && driverDispatches && driverDispatches.length > 0) {
      const loadIds = driverDispatches.map((d) => d.load_id)
      const { data: sameLaneLoads } = await supabase
        .from('loads')
        .select('id')
        .in('id', loadIds)
        .eq('pickup_city', load.pickup_city)
        .eq('delivery_city', load.delivery_city)

      laneCount = sameLaneLoads?.length ?? 0
    }

    const vehicleType = driver.current_vehicle_id
      ? vehicleMap.get(driver.current_vehicle_id) ?? null
      : null

    const factors: ScoringFactors = {
      proximity: calculateProximity(
        lastCity,
        lastState,
        load.pickup_city ?? '',
        load.pickup_state ?? ''
      ),
      availability: calculateAvailability(busyDriverIds.has(driver.id)),
      equipment: calculateEquipment(vehicleType, load.equipment_type),
      performance: calculatePerformance(onTimeCount, totalDeliveries),
      lane: calculateLaneFamiliarity(laneCount),
    }

    suggestions.push({
      driver_id: driver.id,
      driver_name: `${driver.first_name} ${driver.last_name}`,
      score: calculateScore(factors),
      factors,
    })
  }

  // Sort by score descending, return top 10
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}
