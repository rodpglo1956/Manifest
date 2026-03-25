import { describe, it, expect } from 'vitest'
import { getScoreColor, getScoreBgColor } from '@/components/dispatch/driver-suggestions'

describe('DriverSuggestions', () => {
  describe('getScoreColor', () => {
    it('returns green for scores above 70', () => {
      expect(getScoreColor(71)).toBe('text-green-600')
      expect(getScoreColor(85)).toBe('text-green-600')
      expect(getScoreColor(100)).toBe('text-green-600')
    })

    it('returns yellow for scores between 40 and 70 (inclusive)', () => {
      expect(getScoreColor(40)).toBe('text-yellow-600')
      expect(getScoreColor(55)).toBe('text-yellow-600')
      expect(getScoreColor(70)).toBe('text-yellow-600')
    })

    it('returns red for scores below 40', () => {
      expect(getScoreColor(0)).toBe('text-red-600')
      expect(getScoreColor(20)).toBe('text-red-600')
      expect(getScoreColor(39)).toBe('text-red-600')
    })
  })

  describe('getScoreBgColor', () => {
    it('returns green bg for scores above 70', () => {
      expect(getScoreBgColor(85)).toBe('bg-green-500')
    })

    it('returns yellow bg for scores between 40 and 70', () => {
      expect(getScoreBgColor(55)).toBe('bg-yellow-500')
    })

    it('returns red bg for scores below 40', () => {
      expect(getScoreBgColor(20)).toBe('bg-red-500')
    })
  })

  describe('Score color boundary values', () => {
    it('score of exactly 70 is yellow (not green)', () => {
      expect(getScoreColor(70)).toBe('text-yellow-600')
    })

    it('score of exactly 40 is yellow (not red)', () => {
      expect(getScoreColor(40)).toBe('text-yellow-600')
    })

    it('score of 71 is green', () => {
      expect(getScoreColor(71)).toBe('text-green-600')
    })

    it('score of 39 is red', () => {
      expect(getScoreColor(39)).toBe('text-red-600')
    })
  })
})
