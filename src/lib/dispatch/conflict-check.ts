import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type DateRange = {
  start: string | null
  end: string | null
}

/**
 * Pure function to check if two date ranges overlap.
 * If end is null, treats as same-day (start only).
 * Returns false if any start is null.
 */
export function checkDateOverlap(range1: DateRange, range2: DateRange): boolean {
  if (!range1.start || !range2.start) return false

  const start1 = new Date(range1.start).getTime()
  const end1 = range1.end ? new Date(range1.end).getTime() : start1
  const start2 = new Date(range2.start).getTime()
  const end2 = range2.end ? new Date(range2.end).getTime() : start2

  return start1 <= end2 && start2 <= end1
}

/**
 * Checks if a driver has conflicting dispatches for a new load.
 * Queries active dispatches for the driver and checks date overlap.
 */
export async function checkDispatchConflict(
  supabase: SupabaseClient<Database>,
  driverId: string,
  newLoadId: string
): Promise<{ hasConflict: boolean; conflictingLoads: string[] }> {
  // Get the new load's dates
  const { data: newLoad } = await supabase
    .from('loads')
    .select('pickup_date, delivery_date')
    .eq('id', newLoadId)
    .single()

  if (!newLoad) {
    return { hasConflict: false, conflictingLoads: [] }
  }

  // Get active dispatches for this driver (not completed or rejected)
  const { data: activeDispatches } = await supabase
    .from('dispatches')
    .select('load_id')
    .eq('driver_id', driverId)
    .not('status', 'in', '("completed","rejected")')

  if (!activeDispatches || activeDispatches.length === 0) {
    return { hasConflict: false, conflictingLoads: [] }
  }

  const loadIds = activeDispatches.map((d) => d.load_id)

  // Get load dates for active dispatches
  const { data: existingLoads } = await supabase
    .from('loads')
    .select('id, pickup_date, delivery_date')
    .in('id', loadIds)

  if (!existingLoads) {
    return { hasConflict: false, conflictingLoads: [] }
  }

  const conflictingLoads: string[] = []
  const newRange: DateRange = {
    start: newLoad.pickup_date,
    end: newLoad.delivery_date,
  }

  for (const load of existingLoads) {
    const existingRange: DateRange = {
      start: load.pickup_date,
      end: load.delivery_date,
    }
    if (checkDateOverlap(newRange, existingRange)) {
      conflictingLoads.push(load.id)
    }
  }

  return {
    hasConflict: conflictingLoads.length > 0,
    conflictingLoads,
  }
}
