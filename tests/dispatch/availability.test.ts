import { describe, it, expect } from 'vitest'
import type { DispatchStatus } from '@/types/database'

/**
 * Driver availability categorization logic.
 * A driver is "available" if they have no active dispatch
 * (i.e., no dispatch with status NOT IN ('completed', 'rejected')).
 */

const TERMINAL_STATUSES: DispatchStatus[] = ['completed', 'rejected']

function isDispatchActive(status: DispatchStatus): boolean {
  return !TERMINAL_STATUSES.includes(status)
}

function categorizeDrivers(
  drivers: { id: string; status: string }[],
  activeDispatches: { driver_id: string; status: DispatchStatus }[]
) {
  const busyDriverIds = new Set(
    activeDispatches
      .filter((d) => isDispatchActive(d.status))
      .map((d) => d.driver_id)
  )
  const available = drivers.filter((d) => !busyDriverIds.has(d.id))
  const busy = drivers.filter((d) => busyDriverIds.has(d.id))
  return { available, busy }
}

describe('Driver Availability', () => {
  const drivers = [
    { id: 'driver-1', status: 'active' },
    { id: 'driver-2', status: 'active' },
    { id: 'driver-3', status: 'active' },
  ]

  it('all drivers available when no dispatches', () => {
    const { available, busy } = categorizeDrivers(drivers, [])
    expect(available).toHaveLength(3)
    expect(busy).toHaveLength(0)
  })

  it('marks driver with assigned dispatch as busy', () => {
    const dispatches = [{ driver_id: 'driver-1', status: 'assigned' as DispatchStatus }]
    const { available, busy } = categorizeDrivers(drivers, dispatches)
    expect(available).toHaveLength(2)
    expect(busy).toHaveLength(1)
    expect(busy[0].id).toBe('driver-1')
  })

  it('marks driver with en_route_pickup dispatch as busy', () => {
    const dispatches = [{ driver_id: 'driver-2', status: 'en_route_pickup' as DispatchStatus }]
    const { available, busy } = categorizeDrivers(drivers, dispatches)
    expect(available).toHaveLength(2)
    expect(busy).toHaveLength(1)
    expect(busy[0].id).toBe('driver-2')
  })

  it('treats completed dispatch as not active (driver available)', () => {
    const dispatches = [{ driver_id: 'driver-1', status: 'completed' as DispatchStatus }]
    const { available, busy } = categorizeDrivers(drivers, dispatches)
    expect(available).toHaveLength(3)
    expect(busy).toHaveLength(0)
  })

  it('treats rejected dispatch as not active (driver available)', () => {
    const dispatches = [{ driver_id: 'driver-1', status: 'rejected' as DispatchStatus }]
    const { available, busy } = categorizeDrivers(drivers, dispatches)
    expect(available).toHaveLength(3)
    expect(busy).toHaveLength(0)
  })

  it('multiple dispatches - mixed statuses', () => {
    const dispatches = [
      { driver_id: 'driver-1', status: 'accepted' as DispatchStatus },
      { driver_id: 'driver-2', status: 'completed' as DispatchStatus },
      { driver_id: 'driver-3', status: 'en_route_delivery' as DispatchStatus },
    ]
    const { available, busy } = categorizeDrivers(drivers, dispatches)
    expect(available).toHaveLength(1)
    expect(available[0].id).toBe('driver-2')
    expect(busy).toHaveLength(2)
  })

  describe('isDispatchActive', () => {
    it('active statuses are not terminal', () => {
      expect(isDispatchActive('assigned')).toBe(true)
      expect(isDispatchActive('accepted')).toBe(true)
      expect(isDispatchActive('en_route_pickup')).toBe(true)
      expect(isDispatchActive('at_pickup')).toBe(true)
      expect(isDispatchActive('en_route_delivery')).toBe(true)
      expect(isDispatchActive('at_delivery')).toBe(true)
    })

    it('terminal statuses are not active', () => {
      expect(isDispatchActive('completed')).toBe(false)
      expect(isDispatchActive('rejected')).toBe(false)
    })
  })
})
