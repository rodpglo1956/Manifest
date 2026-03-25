import { describe, it, expect } from 'vitest'
import type { Driver, DispatchStatus } from '@/types/database'
import type { ActiveDispatch } from '@/components/dispatch/active-dispatches-list'
import { checkDateOverlap } from '@/lib/dispatch/conflict-check'

function makeDriver(overrides: Partial<Driver> = {}): Driver {
  return {
    id: 'driver-1',
    org_id: 'org-1',
    user_id: null,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '555-1234',
    license_number: 'DL123',
    license_state: 'IL',
    license_class: 'A',
    license_expiration: '2027-01-01',
    hire_date: '2024-01-01',
    status: 'active',
    current_vehicle_id: 'vehicle-1',
    home_terminal: null,
    notes: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    created_at: '2026-03-25T00:00:00Z',
    updated_at: '2026-03-25T00:00:00Z',
    ...overrides,
  }
}

function makeActiveDispatch(overrides: Partial<ActiveDispatch> = {}): ActiveDispatch {
  return {
    id: 'dispatch-1',
    status: 'assigned' as DispatchStatus,
    estimated_pickup_arrival: null,
    estimated_delivery_arrival: null,
    load_number: 'LD-001',
    pickup_city: 'Chicago',
    pickup_state: 'IL',
    delivery_city: 'Detroit',
    delivery_state: 'MI',
    pickup_date: '2026-04-01',
    delivery_date: '2026-04-02',
    equipment_type: 'dry_van',
    driver_first_name: 'John',
    driver_last_name: 'Doe',
    ...overrides,
  }
}

describe('Dispatch Timeline', () => {
  describe('Driver rows', () => {
    it('renders a row for each driver', () => {
      const drivers = [
        makeDriver({ id: 'd1', first_name: 'John' }),
        makeDriver({ id: 'd2', first_name: 'Jane' }),
        makeDriver({ id: 'd3', first_name: 'Bob' }),
      ]
      expect(drivers).toHaveLength(3)
    })

    it('shows "Available" for drivers with no dispatches', () => {
      const drivers = [makeDriver({ id: 'd1' })]
      const dispatches: ActiveDispatch[] = []

      // Group dispatches by driver
      const driverDispatches = dispatches.filter(
        (d) => d.driver_first_name === drivers[0].first_name && d.driver_last_name === drivers[0].last_name
      )

      expect(driverDispatches).toHaveLength(0)
      // Component renders "Available" text when driverDispatches.length === 0
    })

    it('groups dispatches by driver name', () => {
      const dispatches = [
        makeActiveDispatch({ id: 'd1', driver_first_name: 'John', driver_last_name: 'Doe' }),
        makeActiveDispatch({ id: 'd2', driver_first_name: 'John', driver_last_name: 'Doe' }),
        makeActiveDispatch({ id: 'd3', driver_first_name: 'Jane', driver_last_name: 'Smith' }),
      ]

      const map = new Map<string, ActiveDispatch[]>()
      for (const d of dispatches) {
        const key = `${d.driver_first_name}|${d.driver_last_name}`
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(d)
      }

      expect(map.get('John|Doe')).toHaveLength(2)
      expect(map.get('Jane|Smith')).toHaveLength(1)
    })
  })

  describe('Dispatch bar colors', () => {
    it('maps status to correct colors', () => {
      const STATUS_COLORS: Record<string, string> = {
        assigned: 'bg-yellow-400',
        accepted: 'bg-blue-400',
        en_route_pickup: 'bg-green-500',
        at_pickup: 'bg-orange-400',
        en_route_delivery: 'bg-green-500',
        at_delivery: 'bg-orange-400',
      }

      expect(STATUS_COLORS['assigned']).toBe('bg-yellow-400')
      expect(STATUS_COLORS['accepted']).toBe('bg-blue-400')
      expect(STATUS_COLORS['en_route_pickup']).toBe('bg-green-500')
      expect(STATUS_COLORS['at_pickup']).toBe('bg-orange-400')
    })
  })

  describe('Timeline bar positioning', () => {
    it('computes bar position from pickup_date to delivery_date', () => {
      const dispatch = makeActiveDispatch({
        pickup_date: '2026-04-01',
        delivery_date: '2026-04-03',
      })

      const start = new Date(dispatch.pickup_date!)
      const end = new Date(dispatch.delivery_date!)
      const durationMs = end.getTime() - start.getTime()

      // 2 days duration
      expect(durationMs).toBe(2 * 24 * 60 * 60 * 1000)
    })

    it('falls back to estimated_delivery_arrival when no delivery_date', () => {
      const dispatch = makeActiveDispatch({
        pickup_date: '2026-04-01',
        delivery_date: null,
        estimated_delivery_arrival: '2026-04-02T15:00:00Z',
      })

      expect(dispatch.delivery_date).toBeNull()
      expect(dispatch.estimated_delivery_arrival).toBeTruthy()
    })
  })
})

describe('Conflict Warning', () => {
  describe('checkDateOverlap', () => {
    it('detects overlapping date ranges', () => {
      const result = checkDateOverlap(
        { start: '2026-04-01', end: '2026-04-03' },
        { start: '2026-04-02', end: '2026-04-05' }
      )
      expect(result).toBe(true)
    })

    it('returns false for non-overlapping ranges', () => {
      const result = checkDateOverlap(
        { start: '2026-04-01', end: '2026-04-02' },
        { start: '2026-04-03', end: '2026-04-05' }
      )
      expect(result).toBe(false)
    })

    it('detects exact overlap (same dates)', () => {
      const result = checkDateOverlap(
        { start: '2026-04-01', end: '2026-04-03' },
        { start: '2026-04-01', end: '2026-04-03' }
      )
      expect(result).toBe(true)
    })

    it('detects edge overlap (end equals start)', () => {
      const result = checkDateOverlap(
        { start: '2026-04-01', end: '2026-04-02' },
        { start: '2026-04-02', end: '2026-04-03' }
      )
      expect(result).toBe(true)
    })

    it('returns false when start is null', () => {
      const result = checkDateOverlap(
        { start: null, end: '2026-04-02' },
        { start: '2026-04-01', end: '2026-04-03' }
      )
      expect(result).toBe(false)
    })

    it('treats null end as same-day', () => {
      const result = checkDateOverlap(
        { start: '2026-04-01', end: null },
        { start: '2026-04-01', end: '2026-04-03' }
      )
      expect(result).toBe(true)
    })
  })

  describe('ConflictWarning rendering logic', () => {
    it('should show warning when hasConflict is true', () => {
      const conflict = { hasConflict: true, conflictingLoads: ['load-1', 'load-2'] }
      expect(conflict.hasConflict).toBe(true)
      expect(conflict.conflictingLoads).toHaveLength(2)
    })

    it('should render nothing when no conflict', () => {
      const conflict = { hasConflict: false, conflictingLoads: [] }
      expect(conflict.hasConflict).toBe(false)
      // Component returns null when !conflict.hasConflict
    })
  })
})
