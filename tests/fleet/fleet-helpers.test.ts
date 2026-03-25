import { describe, it, expect } from 'vitest'
import {
  calculateCostPerMile,
  calculateFleetCostPerMile,
  calculateMPG,
  getMaintenanceStatus,
  formatCurrency,
  VEHICLE_CLASS_LABELS,
  MAINTENANCE_TYPE_LABELS,
} from '@/lib/fleet/fleet-helpers'

describe('calculateCostPerMile', () => {
  it('calculates basic cost per mile', () => {
    const result = calculateCostPerMile({
      maintenanceCosts: 5000,
      fuelCosts: 15000,
      totalMiles: 100000,
    })
    expect(result).toBe(0.20)
  })

  it('returns 0 when totalMiles is 0', () => {
    const result = calculateCostPerMile({
      maintenanceCosts: 5000,
      fuelCosts: 15000,
      totalMiles: 0,
    })
    expect(result).toBe(0)
  })

  it('includes depreciation when purchase and current value provided', () => {
    const result = calculateCostPerMile({
      maintenanceCosts: 5000,
      fuelCosts: 15000,
      purchasePrice: 160000,
      currentValue: 140000,
      totalMiles: 100000,
    })
    // (5000 + 15000 + 20000 depreciation) / 100000 = 0.40
    expect(result).toBe(0.40)
  })

  it('includes prorated insurance when provided', () => {
    const result = calculateCostPerMile({
      maintenanceCosts: 0,
      fuelCosts: 0,
      insuranceCostPerMonth: 500,
      monthsOwned: 12,
      totalMiles: 60000,
    })
    // (500 * 12) / 60000 = 0.10
    expect(result).toBe(0.10)
  })

  it('includes all cost components together', () => {
    const result = calculateCostPerMile({
      maintenanceCosts: 3000,
      fuelCosts: 12000,
      insuranceCostPerMonth: 400,
      monthsOwned: 6,
      purchasePrice: 150000,
      currentValue: 145000,
      totalMiles: 50000,
    })
    // maint:3000 + fuel:12000 + insurance:2400 + depreciation:5000 = 22400 / 50000 = 0.45
    expect(result).toBe(0.45)
  })

  it('rounds to 2 decimal places', () => {
    const result = calculateCostPerMile({
      maintenanceCosts: 1000,
      fuelCosts: 2000,
      totalMiles: 30000,
    })
    // 3000 / 30000 = 0.10
    expect(result).toBe(0.10)
  })
})

describe('calculateFleetCostPerMile', () => {
  it('aggregates costs across fleet', () => {
    const result = calculateFleetCostPerMile([
      { maintenanceCosts: 2000, fuelCosts: 8000, totalMiles: 50000 },
      { maintenanceCosts: 3000, fuelCosts: 12000, totalMiles: 70000 },
    ])
    // (2000+3000+8000+12000) / (50000+70000) = 25000/120000 = 0.21
    expect(result).toBe(0.21)
  })

  it('returns 0 for empty array', () => {
    expect(calculateFleetCostPerMile([])).toBe(0)
  })

  it('returns 0 when total miles is 0', () => {
    const result = calculateFleetCostPerMile([
      { maintenanceCosts: 1000, fuelCosts: 500, totalMiles: 0 },
    ])
    expect(result).toBe(0)
  })
})

describe('calculateMPG', () => {
  it('calculates miles per gallon', () => {
    expect(calculateMPG(600, 100)).toBe(6.00)
  })

  it('returns 0 when gallons is 0', () => {
    expect(calculateMPG(600, 0)).toBe(0)
  })

  it('rounds to 2 decimal places', () => {
    expect(calculateMPG(1000, 150)).toBe(6.67)
  })
})

describe('getMaintenanceStatus', () => {
  it('returns overdue when past nextServiceDate', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 5)
    const result = getMaintenanceStatus({
      nextServiceDate: pastDate.toISOString().split('T')[0],
    })
    expect(result).toBe('overdue')
  })

  it('returns overdue when past nextServiceOdometer', () => {
    const result = getMaintenanceStatus({
      nextServiceOdometer: 100000,
      currentOdometer: 105000,
    })
    expect(result).toBe('overdue')
  })

  it('returns due_soon when within 30 days of nextServiceDate', () => {
    const soon = new Date()
    soon.setDate(soon.getDate() + 15)
    const result = getMaintenanceStatus({
      nextServiceDate: soon.toISOString().split('T')[0],
    })
    expect(result).toBe('due_soon')
  })

  it('returns due_soon when within 3000 miles of nextServiceOdometer', () => {
    const result = getMaintenanceStatus({
      nextServiceOdometer: 100000,
      currentOdometer: 98000,
    })
    expect(result).toBe('due_soon')
  })

  it('returns ok when not overdue and not due soon', () => {
    const farFuture = new Date()
    farFuture.setDate(farFuture.getDate() + 90)
    const result = getMaintenanceStatus({
      nextServiceDate: farFuture.toISOString().split('T')[0],
      nextServiceOdometer: 200000,
      currentOdometer: 100000,
    })
    expect(result).toBe('ok')
  })

  it('returns ok when no next service info provided', () => {
    const result = getMaintenanceStatus({})
    expect(result).toBe('ok')
  })
})

describe('formatCurrency', () => {
  it('formats positive amounts', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('formats large amounts', () => {
    expect(formatCurrency(165000)).toBe('$165,000.00')
  })
})

describe('Label maps', () => {
  it('VEHICLE_CLASS_LABELS has all 7 classes', () => {
    expect(Object.keys(VEHICLE_CLASS_LABELS)).toHaveLength(7)
    expect(VEHICLE_CLASS_LABELS.class_1_2).toContain('Light')
    expect(VEHICLE_CLASS_LABELS.class_8).toContain('Heavy')
  })

  it('MAINTENANCE_TYPE_LABELS has all 16 types', () => {
    expect(Object.keys(MAINTENANCE_TYPE_LABELS)).toHaveLength(16)
    expect(MAINTENANCE_TYPE_LABELS.oil_change).toBe('Oil Change')
  })
})
