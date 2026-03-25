import { describe, it, expect } from 'vitest'
import {
  calculateProximity,
  calculateAvailability,
  calculateEquipment,
  calculatePerformance,
  calculateLaneFamiliarity,
} from '@/lib/routing/factors'
import { calculateScore, WEIGHTS } from '@/lib/routing/scoring'
import { isAdjacent } from '@/lib/routing/adjacency'
import type { ScoringFactors } from '@/types/marie'

describe('Factor Calculators', () => {
  describe('calculateProximity', () => {
    it('returns 1.0 for same city and state', () => {
      expect(calculateProximity('Dallas', 'TX', 'Dallas', 'TX')).toBe(1.0)
    })

    it('returns 1.0 case-insensitive', () => {
      expect(calculateProximity('dallas', 'tx', 'Dallas', 'TX')).toBe(1.0)
    })

    it('returns 0.7 for same state different city', () => {
      expect(calculateProximity('Houston', 'TX', 'Dallas', 'TX')).toBe(0.7)
    })

    it('returns 0.4 for adjacent state', () => {
      expect(calculateProximity('Tulsa', 'OK', 'Dallas', 'TX')).toBe(0.4)
    })

    it('returns 0.1 for far state', () => {
      expect(calculateProximity('Portland', 'OR', 'Dallas', 'TX')).toBe(0.1)
    })

    it('returns 0.1 for null values', () => {
      expect(calculateProximity(null, null, 'Dallas', 'TX')).toBe(0.1)
    })
  })

  describe('calculateAvailability', () => {
    it('returns 1.0 for driver with no active dispatch', () => {
      expect(calculateAvailability(false)).toBe(1.0)
    })

    it('returns 0.0 for driver with active dispatch', () => {
      expect(calculateAvailability(true)).toBe(0.0)
    })
  })

  describe('calculateEquipment', () => {
    it('returns 1.0 for matching vehicle type', () => {
      expect(calculateEquipment('dry_van', 'dry_van')).toBe(1.0)
    })

    it('returns 0.0 for mismatching vehicle type', () => {
      expect(calculateEquipment('reefer', 'dry_van')).toBe(0.0)
    })

    it('returns 0.8 when load has no equipment requirement', () => {
      expect(calculateEquipment('dry_van', null)).toBe(0.8)
    })

    it('returns 0.0 when vehicle type is null', () => {
      expect(calculateEquipment(null, 'dry_van')).toBe(0.0)
    })
  })

  describe('calculatePerformance', () => {
    it('returns ratio of on-time deliveries', () => {
      expect(calculatePerformance(8, 10)).toBe(0.8)
    })

    it('returns 0.5 when no deliveries', () => {
      expect(calculatePerformance(0, 0)).toBe(0.5)
    })

    it('clamps at 1.0', () => {
      expect(calculatePerformance(10, 10)).toBe(1.0)
    })

    it('returns 0.0 for no on-time', () => {
      expect(calculatePerformance(0, 10)).toBe(0.0)
    })
  })

  describe('calculateLaneFamiliarity', () => {
    it('returns normalized count capped at 1.0', () => {
      expect(calculateLaneFamiliarity(3)).toBe(0.6)
    })

    it('caps at 1.0 for 5 or more runs', () => {
      expect(calculateLaneFamiliarity(5)).toBe(1.0)
    })

    it('caps at 1.0 for more than 5 runs', () => {
      expect(calculateLaneFamiliarity(10)).toBe(1.0)
    })

    it('returns 0.0 for zero runs', () => {
      expect(calculateLaneFamiliarity(0)).toBe(0.0)
    })
  })
})

describe('calculateScore', () => {
  it('returns 100 with all 1.0 factors', () => {
    const factors: ScoringFactors = {
      proximity: 1.0,
      availability: 1.0,
      equipment: 1.0,
      performance: 1.0,
      lane: 1.0,
    }
    expect(calculateScore(factors)).toBe(100)
  })

  it('returns 0 with all 0.0 factors', () => {
    const factors: ScoringFactors = {
      proximity: 0.0,
      availability: 0.0,
      equipment: 0.0,
      performance: 0.0,
      lane: 0.0,
    }
    expect(calculateScore(factors)).toBe(0)
  })

  it('correctly applies weights', () => {
    const factors: ScoringFactors = {
      proximity: 1.0,
      availability: 0.0,
      equipment: 0.0,
      performance: 0.0,
      lane: 0.0,
    }
    // 1.0 * 30 = 30
    expect(calculateScore(factors)).toBe(30)
  })

  it('rounds to nearest integer', () => {
    const factors: ScoringFactors = {
      proximity: 0.5,
      availability: 0.5,
      equipment: 0.5,
      performance: 0.5,
      lane: 0.5,
    }
    // 0.5 * (30 + 25 + 20 + 15 + 10) = 0.5 * 100 = 50
    expect(calculateScore(factors)).toBe(50)
  })
})

describe('WEIGHTS', () => {
  it('sums to 1.0', () => {
    const sum =
      WEIGHTS.proximity +
      WEIGHTS.availability +
      WEIGHTS.equipment +
      WEIGHTS.performance +
      WEIGHTS.lane
    expect(sum).toBeCloseTo(1.0)
  })
})

describe('isAdjacent', () => {
  it('returns true for TX and OK', () => {
    expect(isAdjacent('TX', 'OK')).toBe(true)
  })

  it('returns true for OK and TX', () => {
    expect(isAdjacent('OK', 'TX')).toBe(true)
  })

  it('returns false for TX and OR', () => {
    expect(isAdjacent('TX', 'OR')).toBe(false)
  })

  it('handles case insensitivity', () => {
    expect(isAdjacent('tx', 'ok')).toBe(true)
  })
})
