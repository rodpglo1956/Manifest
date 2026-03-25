import type { VehicleClass, MaintenanceType } from '@/types/database'

// ============================================================
// Cost per mile calculation
// ============================================================

type CostPerMileParams = {
  maintenanceCosts: number
  fuelCosts: number
  insuranceCostPerMonth?: number
  purchasePrice?: number
  currentValue?: number
  monthsOwned?: number
  totalMiles: number
}

export function calculateCostPerMile(params: CostPerMileParams): number {
  const {
    maintenanceCosts,
    fuelCosts,
    insuranceCostPerMonth,
    purchasePrice,
    currentValue,
    monthsOwned,
    totalMiles,
  } = params

  if (totalMiles === 0) return 0

  let totalCost = maintenanceCosts + fuelCosts

  // Add depreciation when both purchase and current value provided
  if (purchasePrice !== undefined && currentValue !== undefined) {
    totalCost += purchasePrice - currentValue
  }

  // Add prorated insurance
  if (insuranceCostPerMonth !== undefined && monthsOwned !== undefined) {
    totalCost += insuranceCostPerMonth * monthsOwned
  }

  return Math.round((totalCost / totalMiles) * 100) / 100
}

// ============================================================
// Fleet-wide cost per mile
// ============================================================

type FleetVehicleCost = {
  maintenanceCosts: number
  fuelCosts: number
  totalMiles: number
}

export function calculateFleetCostPerMile(vehicles: FleetVehicleCost[]): number {
  if (vehicles.length === 0) return 0

  const totalCosts = vehicles.reduce(
    (sum, v) => sum + v.maintenanceCosts + v.fuelCosts,
    0
  )
  const totalMiles = vehicles.reduce((sum, v) => sum + v.totalMiles, 0)

  if (totalMiles === 0) return 0

  return Math.round((totalCosts / totalMiles) * 100) / 100
}

// ============================================================
// MPG calculation
// ============================================================

export function calculateMPG(totalMiles: number, totalGallons: number): number {
  if (totalGallons === 0) return 0
  return Math.round((totalMiles / totalGallons) * 100) / 100
}

// ============================================================
// Maintenance status detection
// ============================================================

type MaintenanceStatusParams = {
  lastServiceDate?: string
  nextServiceDate?: string
  nextServiceOdometer?: number
  currentOdometer?: number
}

export function getMaintenanceStatus(
  params: MaintenanceStatusParams
): 'overdue' | 'due_soon' | 'ok' {
  const { nextServiceDate, nextServiceOdometer, currentOdometer } = params
  const now = new Date()

  // Check date-based overdue
  if (nextServiceDate) {
    const nextDate = new Date(nextServiceDate)
    if (nextDate < now) return 'overdue'
  }

  // Check odometer-based overdue
  if (
    nextServiceOdometer !== undefined &&
    currentOdometer !== undefined &&
    currentOdometer >= nextServiceOdometer
  ) {
    return 'overdue'
  }

  // Check date-based due soon (within 30 days)
  if (nextServiceDate) {
    const nextDate = new Date(nextServiceDate)
    const daysUntil =
      (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    if (daysUntil <= 30) return 'due_soon'
  }

  // Check odometer-based due soon (within 3000 miles)
  if (
    nextServiceOdometer !== undefined &&
    currentOdometer !== undefined &&
    nextServiceOdometer - currentOdometer <= 3000
  ) {
    return 'due_soon'
  }

  return 'ok'
}

// ============================================================
// Currency formatting
// ============================================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// ============================================================
// Label maps
// ============================================================

export const VEHICLE_CLASS_LABELS: Record<VehicleClass, string> = {
  class_1_2: 'Class 1-2 (Light)',
  class_3_4: 'Class 3-4 (Medium)',
  class_5_6: 'Class 5-6 (Medium-Heavy)',
  class_7: 'Class 7 (Heavy)',
  class_8: 'Class 8 (Heavy)',
  trailer: 'Trailer',
  other: 'Other',
}

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  oil_change: 'Oil Change',
  tire_rotation: 'Tire Rotation',
  tire_replacement: 'Tire Replacement',
  brake_service: 'Brake Service',
  transmission: 'Transmission',
  engine: 'Engine',
  electrical: 'Electrical',
  hvac: 'HVAC',
  body_work: 'Body Work',
  dot_inspection: 'DOT Inspection',
  preventive: 'Preventive',
  recall: 'Recall',
  roadside_repair: 'Roadside Repair',
  scheduled_service: 'Scheduled Service',
  unscheduled_repair: 'Unscheduled Repair',
  other: 'Other',
}
