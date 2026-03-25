import type { DriverQualification } from '@/types/database'

export interface HealthScoreMetrics {
  totalItems: number
  overdueItems: number
  dueSoonItems: number
  totalDrivers: number
  driversWithCompleteDQ: number
  totalVehicles: number
  vehiclesWithCurrentInspection: number
}

/**
 * Calculate compliance health score (0-100).
 * Weighted: overdue 40%, due-soon 15%, DQ completeness 25%, inspection currency 20%.
 * Full score when no items/drivers/vehicles exist (nothing to be non-compliant about).
 */
export function calculateHealthScore(metrics: HealthScoreMetrics): number {
  let score = 0

  // Overdue items (40 pts max, penalized 3x ratio)
  if (metrics.totalItems === 0) {
    score += 40
  } else {
    const overdueRatio = metrics.overdueItems / metrics.totalItems
    score += Math.max(0, 40 - overdueRatio * 3 * 40)
  }

  // Due-soon items (15 pts max, penalized 2x ratio)
  if (metrics.totalItems === 0) {
    score += 15
  } else {
    const dueSoonRatio = metrics.dueSoonItems / metrics.totalItems
    score += Math.max(0, 15 - dueSoonRatio * 2 * 15)
  }

  // DQ completeness (25 pts max, proportional)
  if (metrics.totalDrivers === 0) {
    score += 25
  } else {
    const dqRatio = metrics.driversWithCompleteDQ / metrics.totalDrivers
    score += dqRatio * 25
  }

  // Inspection currency (20 pts max, proportional)
  if (metrics.totalVehicles === 0) {
    score += 20
  } else {
    const inspRatio = metrics.vehiclesWithCurrentInspection / metrics.totalVehicles
    score += inspRatio * 20
  }

  return Math.round(score)
}

/**
 * Calculate DQ file completeness for a driver.
 * Checks 8 required FMCSA fields. Returns percentage and list of missing items.
 */
export function calculateDQCompleteness(
  dq: DriverQualification
): { percentage: number; missing: string[] } {
  const missing: string[] = []
  const today = new Date().toISOString().split('T')[0]

  if (!dq.application_date) missing.push('application_date')
  if (!dq.cdl_number) missing.push('cdl_number')
  if (!dq.medical_card_expiry) {
    missing.push('medical_card_expiry')
  } else if (dq.medical_card_expiry < today) {
    missing.push('medical_card_expiry')
  }
  if (!dq.mvr_last_pulled) {
    missing.push('mvr_last_pulled')
  } else {
    const mvrDate = new Date(dq.mvr_last_pulled)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    if (mvrDate < oneYearAgo) {
      missing.push('mvr_last_pulled')
    }
  }
  if (!dq.road_test_date) missing.push('road_test_date')
  if (!dq.annual_review_date) {
    missing.push('annual_review_date')
  } else {
    const reviewDate = new Date(dq.annual_review_date)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    if (reviewDate < oneYearAgo) {
      missing.push('annual_review_date')
    }
  }
  if (!dq.drug_test_last_date) missing.push('drug_test_last_date')
  if (!dq.hire_date) missing.push('hire_date')

  const total = 8
  const complete = total - missing.length
  const percentage = Math.round((complete / total) * 100)

  return { percentage, missing }
}

/**
 * Calculate the next due date based on recurrence rule.
 */
export function calculateNextDueDate(
  fromDate: string,
  rule: string,
  customMonths?: number
): string {
  const date = new Date(fromDate + 'T00:00:00')

  switch (rule) {
    case 'annual':
      date.setFullYear(date.getFullYear() + 1)
      break
    case 'biennial':
      date.setFullYear(date.getFullYear() + 2)
      break
    case 'quarterly':
      date.setMonth(date.getMonth() + 3)
      break
    case 'monthly':
      date.setMonth(date.getMonth() + 1)
      break
    case 'custom':
      date.setMonth(date.getMonth() + (customMonths ?? 1))
      break
    default:
      date.setFullYear(date.getFullYear() + 1)
  }

  return date.toISOString().split('T')[0]
}

/**
 * Get the full list of DOT-required compliance categories.
 */
export function getDOTRequiredCategories(): string[] {
  return [
    'dot_inspection',
    'insurance',
    'ifta',
    'ucr',
    'drug_testing',
    'driver_qualification',
    'vehicle_registration',
    'operating_authority',
    'hazmat',
    'medical_card',
    'cdl_renewal',
    'annual_inspection',
    'state_permit',
    'bod_filing',
    'insurance_filing',
  ]
}

/**
 * Get subset of categories for non-DOT carriers.
 */
export function getNonDOTRequiredCategories(): string[] {
  return ['insurance', 'vehicle_registration', 'state_permit', 'custom']
}
