import { describe, it, expect } from 'vitest'
import { checkDateOverlap } from '@/lib/dispatch/conflict-check'

describe('conflict-check', () => {
  describe('checkDateOverlap', () => {
    it('returns true for overlapping date ranges', () => {
      const result = checkDateOverlap(
        { start: '2026-03-20', end: '2026-03-25' },
        { start: '2026-03-23', end: '2026-03-28' }
      )
      expect(result).toBe(true)
    })

    it('returns false for non-overlapping date ranges', () => {
      const result = checkDateOverlap(
        { start: '2026-03-20', end: '2026-03-22' },
        { start: '2026-03-25', end: '2026-03-28' }
      )
      expect(result).toBe(false)
    })

    it('returns true for same day ranges', () => {
      const result = checkDateOverlap(
        { start: '2026-03-20', end: '2026-03-20' },
        { start: '2026-03-20', end: '2026-03-20' }
      )
      expect(result).toBe(true)
    })

    it('returns true when one range contains the other', () => {
      const result = checkDateOverlap(
        { start: '2026-03-18', end: '2026-03-30' },
        { start: '2026-03-20', end: '2026-03-25' }
      )
      expect(result).toBe(true)
    })

    it('returns true for adjacent ranges sharing an endpoint', () => {
      const result = checkDateOverlap(
        { start: '2026-03-20', end: '2026-03-25' },
        { start: '2026-03-25', end: '2026-03-28' }
      )
      expect(result).toBe(true)
    })

    it('returns false when start is null', () => {
      const result = checkDateOverlap(
        { start: null, end: '2026-03-25' },
        { start: '2026-03-23', end: '2026-03-28' }
      )
      expect(result).toBe(false)
    })

    it('returns false when both starts are null', () => {
      const result = checkDateOverlap(
        { start: null, end: '2026-03-25' },
        { start: null, end: '2026-03-28' }
      )
      expect(result).toBe(false)
    })

    it('treats null end as same-day (single day range)', () => {
      const result = checkDateOverlap(
        { start: '2026-03-20', end: null },
        { start: '2026-03-20', end: '2026-03-25' }
      )
      expect(result).toBe(true)
    })

    it('returns false for single day with no overlap', () => {
      const result = checkDateOverlap(
        { start: '2026-03-20', end: null },
        { start: '2026-03-22', end: '2026-03-25' }
      )
      expect(result).toBe(false)
    })
  })
})
