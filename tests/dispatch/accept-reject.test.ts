import { describe, it, expect } from 'vitest'
import { canDispatchTransition } from '@/lib/dispatch-status'

describe('Accept/Reject Flow - Status Transition Validation', () => {
  describe('Accept flow', () => {
    it('allows assigned -> accepted', () => {
      expect(canDispatchTransition('assigned', 'accepted')).toBe(true)
    })

    it('rejects accept from non-assigned status', () => {
      expect(canDispatchTransition('en_route_pickup', 'accepted')).toBe(false)
      expect(canDispatchTransition('completed', 'accepted')).toBe(false)
      expect(canDispatchTransition('rejected', 'accepted')).toBe(false)
    })

    it('only assigned status can transition to accepted', () => {
      const nonAssigned = ['accepted', 'en_route_pickup', 'at_pickup', 'en_route_delivery', 'at_delivery', 'completed', 'rejected'] as const
      for (const status of nonAssigned) {
        expect(canDispatchTransition(status, 'accepted')).toBe(false)
      }
    })
  })

  describe('Reject flow', () => {
    it('allows assigned -> rejected', () => {
      expect(canDispatchTransition('assigned', 'rejected')).toBe(true)
    })

    it('rejects reject from non-assigned status', () => {
      expect(canDispatchTransition('accepted', 'rejected')).toBe(false)
      expect(canDispatchTransition('en_route_pickup', 'rejected')).toBe(false)
      expect(canDispatchTransition('completed', 'rejected')).toBe(false)
    })

    it('rejected is a terminal state', () => {
      const allStatuses = ['assigned', 'accepted', 'en_route_pickup', 'at_pickup', 'en_route_delivery', 'at_delivery', 'completed', 'rejected'] as const
      for (const status of allStatuses) {
        expect(canDispatchTransition('rejected', status)).toBe(false)
      }
    })
  })

  describe('Status progression after accept', () => {
    it('follows the full lifecycle after acceptance', () => {
      expect(canDispatchTransition('accepted', 'en_route_pickup')).toBe(true)
      expect(canDispatchTransition('en_route_pickup', 'at_pickup')).toBe(true)
      expect(canDispatchTransition('at_pickup', 'en_route_delivery')).toBe(true)
      expect(canDispatchTransition('en_route_delivery', 'at_delivery')).toBe(true)
      expect(canDispatchTransition('at_delivery', 'completed')).toBe(true)
    })
  })
})
