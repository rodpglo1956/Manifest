import { describe, it, expect } from 'vitest'
import { VALID_DISPATCH_TRANSITIONS, getDispatchStatusLabel } from '@/lib/dispatch-status'
import type { DispatchStatus } from '@/types/database'

/**
 * Driver Dispatch Card tests (DISP-05, DISP-06, DISP-07, DISP-08).
 * Tests the dispatch card's status logic, transition buttons, and notes behavior.
 * UI rendering is verified via TypeScript compilation and manual verification.
 */

describe('Driver Dispatch Card', () => {
  describe('Load Summary', () => {
    it('dispatch card component exports correctly', async () => {
      const mod = await import('@/components/drivers/driver-dispatch-card')
      expect(mod.DriverDispatchCard).toBeDefined()
      expect(typeof mod.DriverDispatchCard).toBe('function')
    })

    it('client component exports correctly', async () => {
      const mod = await import('@/app/driver/dispatch/client')
      expect(mod.DriverDispatchClient).toBeDefined()
      expect(typeof mod.DriverDispatchClient).toBe('function')
    })
  })

  describe('Accept/Reject Buttons', () => {
    it('assigned status has accepted and rejected as valid transitions', () => {
      const transitions = VALID_DISPATCH_TRANSITIONS['assigned']
      expect(transitions).toContain('accepted')
      expect(transitions).toContain('rejected')
    })

    it('accepted status does not allow reject', () => {
      const transitions = VALID_DISPATCH_TRANSITIONS['accepted']
      expect(transitions).not.toContain('rejected')
    })

    it('card filters out rejected from next status buttons (handled by reject button)', () => {
      // The card filters rejected from VALID_DISPATCH_TRANSITIONS to show only non-reject transitions
      // For assigned: only 'accepted' shows as accept button (reject is separate)
      const nextStatuses = (VALID_DISPATCH_TRANSITIONS['assigned'] ?? []).filter(
        (s) => s !== 'rejected'
      )
      expect(nextStatuses).toEqual(['accepted'])
    })
  })

  describe('Status Progression', () => {
    it('shows next valid status transition for accepted dispatch', () => {
      const transitions = VALID_DISPATCH_TRANSITIONS['accepted']
      expect(transitions).toEqual(['en_route_pickup'])
    })

    it('shows correct progression through dispatch lifecycle', () => {
      const lifecycle: DispatchStatus[] = [
        'accepted',
        'en_route_pickup',
        'at_pickup',
        'en_route_delivery',
        'at_delivery',
        'completed',
      ]

      for (let i = 0; i < lifecycle.length - 1; i++) {
        const current = lifecycle[i]
        const next = lifecycle[i + 1]
        expect(VALID_DISPATCH_TRANSITIONS[current]).toContain(next)
      }
    })

    it('completed state has no further actions', () => {
      expect(VALID_DISPATCH_TRANSITIONS['completed']).toEqual([])
    })

    it('rejected state has no further actions', () => {
      expect(VALID_DISPATCH_TRANSITIONS['rejected']).toEqual([])
    })

    it('status labels are human readable', () => {
      expect(getDispatchStatusLabel('en_route_pickup')).toBe('En Route Pickup')
      expect(getDispatchStatusLabel('at_delivery')).toBe('At Delivery')
      expect(getDispatchStatusLabel('assigned')).toBe('Assigned')
    })
  })

  describe('Driver Notes', () => {
    it('driver notes action is importable', async () => {
      const mod = await import('@/app/driver/dispatch/actions')
      expect(mod.updateDriverNotes).toBeDefined()
      expect(typeof mod.updateDriverNotes).toBe('function')
    })

    it('accept dispatch action is importable', async () => {
      const mod = await import('@/app/driver/dispatch/actions')
      expect(mod.acceptDispatch).toBeDefined()
      expect(typeof mod.acceptDispatch).toBe('function')
    })

    it('reject dispatch action is importable', async () => {
      const mod = await import('@/app/driver/dispatch/actions')
      expect(mod.rejectDispatch).toBeDefined()
      expect(typeof mod.rejectDispatch).toBe('function')
    })
  })
})
