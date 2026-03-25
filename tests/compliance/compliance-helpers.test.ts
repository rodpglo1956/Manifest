import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  calculateHealthScore,
  calculateDQCompleteness,
  calculateNextDueDate,
  getDOTRequiredCategories,
  getNonDOTRequiredCategories,
} from '@/lib/compliance/compliance-helpers'
import type { DriverQualification } from '@/types/database'

describe('calculateHealthScore', () => {
  it('returns 100 for org with no overdue items, complete DQ files, current inspections', () => {
    const score = calculateHealthScore({
      totalItems: 10,
      overdueItems: 0,
      dueSoonItems: 0,
      totalDrivers: 5,
      driversWithCompleteDQ: 5,
      totalVehicles: 8,
      vehiclesWithCurrentInspection: 8,
    })
    expect(score).toBe(100)
  })

  it('returns 0 for org with all items overdue, no DQ files, no inspections', () => {
    const score = calculateHealthScore({
      totalItems: 10,
      overdueItems: 10,
      dueSoonItems: 0,
      totalDrivers: 5,
      driversWithCompleteDQ: 0,
      totalVehicles: 8,
      vehiclesWithCurrentInspection: 0,
    })
    expect(score).toBe(0)
  })

  it('returns 100 for empty org (no items, no drivers, no vehicles)', () => {
    const score = calculateHealthScore({
      totalItems: 0,
      overdueItems: 0,
      dueSoonItems: 0,
      totalDrivers: 0,
      driversWithCompleteDQ: 0,
      totalVehicles: 0,
      vehiclesWithCurrentInspection: 0,
    })
    expect(score).toBe(100)
  })

  it('applies correct weights for partial compliance', () => {
    const score = calculateHealthScore({
      totalItems: 10,
      overdueItems: 5,
      dueSoonItems: 0,
      totalDrivers: 4,
      driversWithCompleteDQ: 2,
      totalVehicles: 4,
      vehiclesWithCurrentInspection: 2,
    })
    // overdue: max(0, 40 - 0.5*3*40) = max(0, -20) = 0
    // dueSoon: ratio=(0+5)/10=0.5, max(0, 15 - 0.5*2*15) = max(0, 0) = 0
    // DQ: 0.5*25 = 12.5
    // insp: 0.5*20 = 10
    // total: 0 + 0 + 12.5 + 10 = 22.5 => 23
    expect(score).toBe(23)
  })
})

describe('calculateDQCompleteness', () => {
  const today = new Date().toISOString().split('T')[0]
  const futureDate = new Date()
  futureDate.setFullYear(futureDate.getFullYear() + 1)
  const futureDateStr = futureDate.toISOString().split('T')[0]

  const recentDate = new Date()
  recentDate.setMonth(recentDate.getMonth() - 3)
  const recentDateStr = recentDate.toISOString().split('T')[0]

  const baseDQ: DriverQualification = {
    id: '1',
    org_id: '1',
    driver_id: '1',
    cdl_number: 'CDL123',
    cdl_state: 'TX',
    cdl_class: 'A',
    cdl_expiry: futureDateStr,
    medical_card_expiry: futureDateStr,
    endorsements: ['H', 'N'],
    restrictions: null,
    mvr_last_pulled: recentDateStr,
    mvr_status: 'clear',
    drug_test_last_date: recentDateStr,
    drug_test_result: 'negative',
    annual_review_date: recentDateStr,
    road_test_date: recentDateStr,
    application_date: '2024-01-15',
    hire_date: '2024-02-01',
    termination_date: null,
    dq_file_complete: true,
    missing_documents: null,
    created_at: today,
    updated_at: today,
  }

  it('returns 100% when all 8 required fields are present and valid', () => {
    const result = calculateDQCompleteness(baseDQ)
    expect(result.percentage).toBe(100)
    expect(result.missing).toHaveLength(0)
  })

  it('identifies missing fields', () => {
    const dq: DriverQualification = {
      ...baseDQ,
      cdl_number: null,
      application_date: null,
    }
    const result = calculateDQCompleteness(dq)
    expect(result.missing).toContain('cdl_number')
    expect(result.missing).toContain('application_date')
    expect(result.percentage).toBe(75) // 6/8
  })

  it('identifies expired medical card as missing', () => {
    const pastDate = new Date()
    pastDate.setMonth(pastDate.getMonth() - 1)
    const dq: DriverQualification = {
      ...baseDQ,
      medical_card_expiry: pastDate.toISOString().split('T')[0],
    }
    const result = calculateDQCompleteness(dq)
    expect(result.missing).toContain('medical_card_expiry')
  })

  it('identifies stale MVR (> 1 year) as missing', () => {
    const oldDate = new Date()
    oldDate.setFullYear(oldDate.getFullYear() - 2)
    const dq: DriverQualification = {
      ...baseDQ,
      mvr_last_pulled: oldDate.toISOString().split('T')[0],
    }
    const result = calculateDQCompleteness(dq)
    expect(result.missing).toContain('mvr_last_pulled')
  })
})

describe('calculateNextDueDate', () => {
  it("'annual' adds 1 year", () => {
    expect(calculateNextDueDate('2026-01-15', 'annual')).toBe('2027-01-15')
  })

  it("'biennial' adds 2 years", () => {
    expect(calculateNextDueDate('2026-01-15', 'biennial')).toBe('2028-01-15')
  })

  it("'quarterly' adds 3 months", () => {
    expect(calculateNextDueDate('2026-01-15', 'quarterly')).toBe('2026-04-15')
  })

  it("'monthly' adds 1 month", () => {
    expect(calculateNextDueDate('2026-01-15', 'monthly')).toBe('2026-02-15')
  })

  it("'custom' adds N months", () => {
    expect(calculateNextDueDate('2026-01-15', 'custom', 6)).toBe('2026-07-15')
  })
})

describe('getDOTRequiredCategories vs getNonDOTRequiredCategories', () => {
  it('returns full DOT suite with all categories', () => {
    const categories = getDOTRequiredCategories()
    expect(categories.length).toBeGreaterThan(10)
    expect(categories).toContain('dot_inspection')
    expect(categories).toContain('drug_testing')
    expect(categories).toContain('hazmat')
  })

  it('returns smaller subset for non-DOT carriers', () => {
    const dotCats = getDOTRequiredCategories()
    const nonDotCats = getNonDOTRequiredCategories()
    expect(nonDotCats.length).toBeLessThan(dotCats.length)
    expect(nonDotCats).toContain('insurance')
    expect(nonDotCats).toContain('vehicle_registration')
    expect(nonDotCats).not.toContain('dot_inspection')
    expect(nonDotCats).not.toContain('drug_testing')
  })
})
