import { describe, it, expect } from 'vitest'
import {
  DISPATCH_STATUSES,
  VALID_DISPATCH_TRANSITIONS,
  canDispatchTransition,
  getDispatchStatusLabel,
  getDispatchStatusColor,
} from '@/lib/dispatch-status'
import type { DispatchStatus } from '@/types/database'

describe('Dispatch Status Utility', () => {
  describe('DISPATCH_STATUSES', () => {
    it('contains all 8 statuses', () => {
      expect(DISPATCH_STATUSES).toHaveLength(8)
    })

    it('includes all expected statuses in lifecycle order', () => {
      const expected: DispatchStatus[] = [
        'assigned',
        'accepted',
        'en_route_pickup',
        'at_pickup',
        'en_route_delivery',
        'at_delivery',
        'completed',
        'rejected',
      ]
      expect(DISPATCH_STATUSES).toEqual(expected)
    })
  })

  describe('canDispatchTransition', () => {
    it('allows assigned -> accepted', () => {
      expect(canDispatchTransition('assigned', 'accepted')).toBe(true)
    })

    it('allows assigned -> rejected', () => {
      expect(canDispatchTransition('assigned', 'rejected')).toBe(true)
    })

    it('allows accepted -> en_route_pickup', () => {
      expect(canDispatchTransition('accepted', 'en_route_pickup')).toBe(true)
    })

    it('allows en_route_pickup -> at_pickup', () => {
      expect(canDispatchTransition('en_route_pickup', 'at_pickup')).toBe(true)
    })

    it('allows at_pickup -> en_route_delivery', () => {
      expect(canDispatchTransition('at_pickup', 'en_route_delivery')).toBe(true)
    })

    it('allows en_route_delivery -> at_delivery', () => {
      expect(canDispatchTransition('en_route_delivery', 'at_delivery')).toBe(true)
    })

    it('allows at_delivery -> completed', () => {
      expect(canDispatchTransition('at_delivery', 'completed')).toBe(true)
    })

    it('rejects assigned -> completed (skipping steps)', () => {
      expect(canDispatchTransition('assigned', 'completed')).toBe(false)
    })

    it('rejects completed -> anything (terminal state)', () => {
      for (const status of DISPATCH_STATUSES) {
        expect(canDispatchTransition('completed', status)).toBe(false)
      }
    })

    it('rejects rejected -> anything (terminal state)', () => {
      for (const status of DISPATCH_STATUSES) {
        expect(canDispatchTransition('rejected', status)).toBe(false)
      }
    })

    it('rejects backward transitions', () => {
      expect(canDispatchTransition('accepted', 'assigned')).toBe(false)
      expect(canDispatchTransition('en_route_pickup', 'accepted')).toBe(false)
      expect(canDispatchTransition('at_delivery', 'en_route_delivery')).toBe(false)
    })

    it('validates the full happy-path lifecycle', () => {
      const lifecycle: DispatchStatus[] = [
        'assigned',
        'accepted',
        'en_route_pickup',
        'at_pickup',
        'en_route_delivery',
        'at_delivery',
        'completed',
      ]

      for (let i = 0; i < lifecycle.length - 1; i++) {
        expect(
          canDispatchTransition(lifecycle[i], lifecycle[i + 1]),
          `${lifecycle[i]} -> ${lifecycle[i + 1]} should be valid`
        ).toBe(true)
      }
    })
  })

  describe('VALID_DISPATCH_TRANSITIONS structure', () => {
    it('every status has an entry in VALID_DISPATCH_TRANSITIONS', () => {
      for (const status of DISPATCH_STATUSES) {
        expect(VALID_DISPATCH_TRANSITIONS).toHaveProperty(status)
      }
    })

    it('all transition targets are valid DispatchStatus values', () => {
      for (const [, targets] of Object.entries(VALID_DISPATCH_TRANSITIONS)) {
        for (const target of targets) {
          expect(DISPATCH_STATUSES).toContain(target)
        }
      }
    })
  })

  describe('getDispatchStatusLabel', () => {
    it('returns human-readable labels', () => {
      expect(getDispatchStatusLabel('assigned')).toBe('Assigned')
      expect(getDispatchStatusLabel('accepted')).toBe('Accepted')
      expect(getDispatchStatusLabel('en_route_pickup')).toBe('En Route Pickup')
      expect(getDispatchStatusLabel('at_pickup')).toBe('At Pickup')
      expect(getDispatchStatusLabel('en_route_delivery')).toBe('En Route Delivery')
      expect(getDispatchStatusLabel('at_delivery')).toBe('At Delivery')
      expect(getDispatchStatusLabel('completed')).toBe('Completed')
      expect(getDispatchStatusLabel('rejected')).toBe('Rejected')
    })
  })

  describe('getDispatchStatusColor', () => {
    it('returns color classes for all 8 statuses', () => {
      for (const status of DISPATCH_STATUSES) {
        const color = getDispatchStatusColor(status)
        expect(color).toBeTruthy()
        expect(color.length).toBeGreaterThan(0)
      }
    })

    it('returns yellow for assigned', () => {
      expect(getDispatchStatusColor('assigned')).toContain('yellow')
    })

    it('returns blue for accepted', () => {
      expect(getDispatchStatusColor('accepted')).toContain('blue')
    })

    it('returns green for completed', () => {
      expect(getDispatchStatusColor('completed')).toContain('green')
    })

    it('returns red for rejected', () => {
      expect(getDispatchStatusColor('rejected')).toContain('red')
    })
  })
})
