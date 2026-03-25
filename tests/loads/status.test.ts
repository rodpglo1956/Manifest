import { describe, it, expect } from 'vitest'
import {
  LOAD_STATUSES,
  VALID_TRANSITIONS,
  canTransition,
  getStatusColor,
  getStatusLabel,
  STATUS_ORDER,
} from '@/lib/load-status'
import type { LoadStatus } from '@/types/database'

describe('Load Status Utility', () => {
  describe('LOAD_STATUSES', () => {
    it('contains all 10 statuses', () => {
      expect(LOAD_STATUSES).toHaveLength(10)
    })

    it('includes all expected statuses', () => {
      const expected = [
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
      expect(LOAD_STATUSES).toEqual(expected)
    })
  })

  describe('canTransition', () => {
    it('allows booked -> dispatched', () => {
      expect(canTransition('booked', 'dispatched')).toBe(true)
    })

    it('allows dispatched -> in_transit', () => {
      expect(canTransition('dispatched', 'in_transit')).toBe(true)
    })

    it('allows in_transit -> at_pickup', () => {
      expect(canTransition('in_transit', 'at_pickup')).toBe(true)
    })

    it('allows at_pickup -> loaded', () => {
      expect(canTransition('at_pickup', 'loaded')).toBe(true)
    })

    it('allows loaded -> at_delivery', () => {
      expect(canTransition('loaded', 'at_delivery')).toBe(true)
    })

    it('allows at_delivery -> delivered', () => {
      expect(canTransition('at_delivery', 'delivered')).toBe(true)
    })

    it('allows delivered -> invoiced', () => {
      expect(canTransition('delivered', 'invoiced')).toBe(true)
    })

    it('allows invoiced -> paid', () => {
      expect(canTransition('invoiced', 'paid')).toBe(true)
    })

    it('rejects invalid transitions', () => {
      expect(canTransition('booked', 'delivered')).toBe(false)
      expect(canTransition('paid', 'booked')).toBe(false)
      expect(canTransition('in_transit', 'booked')).toBe(false)
    })

    it('rejects transitions from paid', () => {
      for (const status of LOAD_STATUSES) {
        expect(canTransition('paid', status)).toBe(false)
      }
    })

    it('rejects transitions from canceled', () => {
      for (const status of LOAD_STATUSES) {
        expect(canTransition('canceled', status)).toBe(false)
      }
    })

    it('allows canceled from any status except paid and invoiced', () => {
      const cancelableStatuses = [
        'booked',
        'dispatched',
        'in_transit',
        'at_pickup',
        'loaded',
        'at_delivery',
        'delivered',
      ] as const

      for (const status of cancelableStatuses) {
        expect(canTransition(status, 'canceled')).toBe(true)
      }
    })

    it('does not allow canceled from invoiced or paid', () => {
      expect(canTransition('invoiced', 'canceled')).toBe(false)
      expect(canTransition('paid', 'canceled')).toBe(false)
    })
  })

  describe('getStatusColor', () => {
    it('returns yellow for booked and dispatched', () => {
      expect(getStatusColor('booked')).toContain('yellow')
      expect(getStatusColor('dispatched')).toContain('yellow')
    })

    it('returns blue for in-transit statuses', () => {
      expect(getStatusColor('in_transit')).toContain('blue')
      expect(getStatusColor('at_pickup')).toContain('blue')
      expect(getStatusColor('loaded')).toContain('blue')
      expect(getStatusColor('at_delivery')).toContain('blue')
    })

    it('returns green for delivered and paid', () => {
      expect(getStatusColor('delivered')).toContain('green')
      expect(getStatusColor('paid')).toContain('green')
    })

    it('returns red for canceled', () => {
      expect(getStatusColor('canceled')).toContain('red')
    })

    it('returns gray for invoiced', () => {
      expect(getStatusColor('invoiced')).toContain('gray')
    })
  })

  describe('getStatusLabel', () => {
    it('returns human-readable labels', () => {
      expect(getStatusLabel('booked')).toBe('Booked')
      expect(getStatusLabel('in_transit')).toBe('In Transit')
      expect(getStatusLabel('at_pickup')).toBe('At Pickup')
      expect(getStatusLabel('at_delivery')).toBe('At Delivery')
      expect(getStatusLabel('canceled')).toBe('Canceled')
    })
  })

  describe('STATUS_ORDER', () => {
    it('has correct ordering', () => {
      expect(STATUS_ORDER.booked).toBeLessThan(STATUS_ORDER.dispatched)
      expect(STATUS_ORDER.dispatched).toBeLessThan(STATUS_ORDER.in_transit)
      expect(STATUS_ORDER.delivered).toBeLessThan(STATUS_ORDER.invoiced)
      expect(STATUS_ORDER.invoiced).toBeLessThan(STATUS_ORDER.paid)
    })
  })

  describe('canTransition - complete lifecycle path', () => {
    it('validates the full happy-path lifecycle from booked to paid', () => {
      const lifecycle: LoadStatus[] = [
        'booked',
        'dispatched',
        'in_transit',
        'at_pickup',
        'loaded',
        'at_delivery',
        'delivered',
        'invoiced',
        'paid',
      ]

      for (let i = 0; i < lifecycle.length - 1; i++) {
        expect(
          canTransition(lifecycle[i], lifecycle[i + 1]),
          `${lifecycle[i]} -> ${lifecycle[i + 1]} should be valid`
        ).toBe(true)
      }
    })

    it('rejects all backward transitions in the lifecycle', () => {
      const lifecycle: LoadStatus[] = [
        'booked',
        'dispatched',
        'in_transit',
        'at_pickup',
        'loaded',
        'at_delivery',
        'delivered',
        'invoiced',
        'paid',
      ]

      for (let i = 1; i < lifecycle.length; i++) {
        expect(
          canTransition(lifecycle[i], lifecycle[i - 1]),
          `${lifecycle[i]} -> ${lifecycle[i - 1]} should be invalid (backward)`
        ).toBe(false)
      }
    })

    it('rejects skipping steps (booked -> in_transit)', () => {
      expect(canTransition('booked', 'in_transit')).toBe(false)
    })

    it('rejects skipping steps (dispatched -> at_pickup)', () => {
      expect(canTransition('dispatched', 'at_pickup')).toBe(false)
    })

    it('rejects skipping steps (in_transit -> loaded)', () => {
      expect(canTransition('in_transit', 'loaded')).toBe(false)
    })
  })

  describe('VALID_TRANSITIONS structure', () => {
    it('every status has an entry in VALID_TRANSITIONS', () => {
      for (const status of LOAD_STATUSES) {
        expect(VALID_TRANSITIONS).toHaveProperty(status)
      }
    })

    it('all transition targets are valid LoadStatus values', () => {
      for (const [, targets] of Object.entries(VALID_TRANSITIONS)) {
        for (const target of targets) {
          expect(LOAD_STATUSES).toContain(target)
        }
      }
    })
  })
})
