import { describe, it, expect } from 'vitest'
import { vehicleSchema } from '@/schemas/vehicle'
import {
  maintenanceRecordSchema,
  fuelTransactionSchema,
  maintenanceScheduleSchema,
  vehicleAssignmentSchema,
} from '@/schemas/fleet'
import type {
  VehicleClass,
  FuelType,
  MaintenanceType,
  MaintenancePriority,
  FuelSource,
  MaintenanceRecord,
  FuelTransaction,
  MaintenanceSchedule,
  VehicleAssignment,
  VehicleStatus,
  Vehicle,
} from '@/types/database'

describe('Expanded Vehicle Schema', () => {
  const baseVehicle = {
    unit_number: 'T-101',
    year: 2023,
    make: 'Freightliner',
    model: 'Cascadia',
    vehicle_type: 'dry_van' as const,
  }

  it('accepts expanded vehicle_type enum values', () => {
    const types = [
      'medical_van', 'sprinter', 'box_truck', 'hotshot', 'straight_truck',
      'day_cab', 'sleeper', 'flatbed', 'reefer', 'tanker',
      'dry_van_trailer', 'flatbed_trailer', 'reefer_trailer', 'step_deck_trailer', 'other',
    ]
    for (const t of types) {
      const result = vehicleSchema.safeParse({ ...baseVehicle, vehicle_type: t })
      expect(result.success, `vehicle_type ${t} should be valid`).toBe(true)
    }
  })

  it('accepts vehicle_class enum values', () => {
    const classes = ['class_1_2', 'class_3_4', 'class_5_6', 'class_7', 'class_8', 'trailer', 'other']
    for (const c of classes) {
      const result = vehicleSchema.safeParse({ ...baseVehicle, vehicle_class: c })
      expect(result.success, `vehicle_class ${c} should be valid`).toBe(true)
    }
  })

  it('defaults vehicle_class to other', () => {
    const result = vehicleSchema.parse(baseVehicle)
    expect(result.vehicle_class).toBe('other')
  })

  it('accepts expanded status enum', () => {
    const statuses = ['active', 'in_shop', 'out_of_service', 'parked', 'sold', 'totaled']
    for (const s of statuses) {
      const result = vehicleSchema.safeParse({ ...baseVehicle, status: s })
      expect(result.success, `status ${s} should be valid`).toBe(true)
    }
  })

  it('accepts fuel_type enum', () => {
    const fuels = ['diesel', 'gasoline', 'cng', 'electric', 'hybrid']
    for (const f of fuels) {
      const result = vehicleSchema.safeParse({ ...baseVehicle, fuel_type: f })
      expect(result.success, `fuel_type ${f} should be valid`).toBe(true)
    }
  })

  it('accepts optional fleet fields', () => {
    const result = vehicleSchema.safeParse({
      ...baseVehicle,
      license_plate: 'ABC-1234',
      license_state: 'TX',
      registration_expiry: '2027-01-15',
      current_odometer: 125000,
      avg_mpg: 6.5,
      purchase_date: '2023-06-01',
      purchase_price: 165000,
      current_value: 140000,
      insurance_policy: 'POL-123456',
      notes: 'Primary long-haul unit',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid vehicle_type', () => {
    const result = vehicleSchema.safeParse({ ...baseVehicle, vehicle_type: 'submarine' })
    expect(result.success).toBe(false)
  })
})

describe('Maintenance Record Schema', () => {
  const validRecord = {
    vehicle_id: '550e8400-e29b-41d4-a716-446655440000',
    maintenance_type: 'oil_change' as const,
    description: 'Full synthetic oil change',
    date_in: '2026-03-20',
  }

  it('validates a minimal maintenance record', () => {
    const result = maintenanceRecordSchema.safeParse(validRecord)
    expect(result.success).toBe(true)
  })

  it('validates all maintenance_type enum values', () => {
    const types = [
      'oil_change', 'tire_rotation', 'tire_replacement', 'brake_service',
      'transmission', 'engine', 'electrical', 'hvac', 'body_work',
      'dot_inspection', 'preventive', 'recall', 'roadside_repair',
      'scheduled_service', 'unscheduled_repair', 'other',
    ]
    for (const t of types) {
      const result = maintenanceRecordSchema.safeParse({ ...validRecord, maintenance_type: t })
      expect(result.success, `maintenance_type ${t} should be valid`).toBe(true)
    }
  })

  it('requires vehicle_id, maintenance_type, description, date_in', () => {
    expect(maintenanceRecordSchema.safeParse({}).success).toBe(false)
    expect(maintenanceRecordSchema.safeParse({ vehicle_id: validRecord.vehicle_id }).success).toBe(false)
  })

  it('accepts optional cost fields', () => {
    const result = maintenanceRecordSchema.safeParse({
      ...validRecord,
      vendor_name: 'Shop A',
      cost_parts: 150,
      cost_labor: 200,
      cost_total: 350,
      warranty_covered: true,
      date_out: '2026-03-21',
      next_service_odometer: 135000,
      next_service_date: '2026-09-20',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid maintenance_type', () => {
    const result = maintenanceRecordSchema.safeParse({ ...validRecord, maintenance_type: 'car_wash' })
    expect(result.success).toBe(false)
  })
})

describe('Fuel Transaction Schema', () => {
  const validFuel = {
    vehicle_id: '550e8400-e29b-41d4-a716-446655440000',
    transaction_date: '2026-03-20',
    gallons: 120.5,
    total_cost: 480.50,
  }

  it('validates a minimal fuel transaction', () => {
    const result = fuelTransactionSchema.safeParse(validFuel)
    expect(result.success).toBe(true)
  })

  it('requires gallons > 0', () => {
    const result = fuelTransactionSchema.safeParse({ ...validFuel, gallons: 0 })
    expect(result.success).toBe(false)
  })

  it('requires total_cost > 0', () => {
    const result = fuelTransactionSchema.safeParse({ ...validFuel, total_cost: 0 })
    expect(result.success).toBe(false)
  })

  it('accepts optional fields', () => {
    const result = fuelTransactionSchema.safeParse({
      ...validFuel,
      driver_id: '660e8400-e29b-41d4-a716-446655440001',
      location: 'Love\'s Travel Stop',
      city: 'Dallas',
      state: 'TX',
      price_per_gallon: 3.99,
      odometer_reading: 126000,
      source: 'fuel_card',
    })
    expect(result.success).toBe(true)
  })

  it('validates source enum', () => {
    const sources = ['manual', 'fuel_card', 'eld', 'receipt_scan']
    for (const s of sources) {
      const result = fuelTransactionSchema.safeParse({ ...validFuel, source: s })
      expect(result.success, `source ${s} should be valid`).toBe(true)
    }
  })
})

describe('Maintenance Schedule Schema', () => {
  const validSchedule = {
    maintenance_type: 'oil_change' as const,
    interval_miles: 15000,
  }

  it('validates with interval_miles only', () => {
    const result = maintenanceScheduleSchema.safeParse(validSchedule)
    expect(result.success).toBe(true)
  })

  it('validates with interval_days only', () => {
    const result = maintenanceScheduleSchema.safeParse({
      maintenance_type: 'dot_inspection' as const,
      interval_days: 365,
    })
    expect(result.success).toBe(true)
  })

  it('rejects when neither interval_miles nor interval_days provided', () => {
    const result = maintenanceScheduleSchema.safeParse({
      maintenance_type: 'oil_change' as const,
    })
    expect(result.success).toBe(false)
  })

  it('validates priority enum', () => {
    const priorities = ['low', 'normal', 'high', 'critical']
    for (const p of priorities) {
      const result = maintenanceScheduleSchema.safeParse({ ...validSchedule, priority: p })
      expect(result.success, `priority ${p} should be valid`).toBe(true)
    }
  })

  it('defaults priority to normal', () => {
    const result = maintenanceScheduleSchema.parse(validSchedule)
    expect(result.priority).toBe('normal')
  })

  it('defaults active to true', () => {
    const result = maintenanceScheduleSchema.parse(validSchedule)
    expect(result.active).toBe(true)
  })
})

describe('Vehicle Assignment Schema', () => {
  it('validates a vehicle assignment', () => {
    const result = vehicleAssignmentSchema.safeParse({
      vehicle_id: '550e8400-e29b-41d4-a716-446655440000',
      driver_id: '660e8400-e29b-41d4-a716-446655440001',
    })
    expect(result.success).toBe(true)
  })

  it('accepts optional reason', () => {
    const result = vehicleAssignmentSchema.safeParse({
      vehicle_id: '550e8400-e29b-41d4-a716-446655440000',
      driver_id: '660e8400-e29b-41d4-a716-446655440001',
      reason: 'Reassigned due to maintenance',
    })
    expect(result.success).toBe(true)
  })

  it('requires vehicle_id and driver_id', () => {
    expect(vehicleAssignmentSchema.safeParse({}).success).toBe(false)
    expect(vehicleAssignmentSchema.safeParse({ vehicle_id: '550e8400-e29b-41d4-a716-446655440000' }).success).toBe(false)
  })
})

describe('Fleet Database Types', () => {
  it('VehicleClass type has all expected values', () => {
    const classes: VehicleClass[] = ['class_1_2', 'class_3_4', 'class_5_6', 'class_7', 'class_8', 'trailer', 'other']
    expect(classes).toHaveLength(7)
  })

  it('FuelType type has all expected values', () => {
    const fuels: FuelType[] = ['diesel', 'gasoline', 'cng', 'electric', 'hybrid']
    expect(fuels).toHaveLength(5)
  })

  it('MaintenanceType type has all 16 values', () => {
    const types: MaintenanceType[] = [
      'oil_change', 'tire_rotation', 'tire_replacement', 'brake_service',
      'transmission', 'engine', 'electrical', 'hvac', 'body_work',
      'dot_inspection', 'preventive', 'recall', 'roadside_repair',
      'scheduled_service', 'unscheduled_repair', 'other',
    ]
    expect(types).toHaveLength(16)
  })

  it('VehicleStatus expanded type works', () => {
    const statuses: VehicleStatus[] = ['active', 'in_shop', 'out_of_service', 'parked', 'sold', 'totaled']
    expect(statuses).toHaveLength(6)
  })

  it('Vehicle type has expanded fields', () => {
    const v: Vehicle = {
      id: '1',
      org_id: '1',
      unit_number: 'T-101',
      vin: null,
      year: null,
      make: null,
      model: null,
      vehicle_type: 'dry_van',
      vehicle_class: 'class_8',
      fuel_type: 'diesel',
      status: 'active',
      license_plate: null,
      license_state: null,
      registration_expiry: null,
      current_odometer: null,
      odometer_updated_at: null,
      avg_mpg: null,
      purchase_date: null,
      purchase_price: null,
      current_value: null,
      insurance_policy: null,
      gps_device_id: null,
      eld_provider: null,
      eld_device_id: null,
      photo_urls: null,
      notes: null,
      current_driver_id: null,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    }
    expect(v.vehicle_class).toBe('class_8')
    expect(v.fuel_type).toBe('diesel')
  })

  it('MaintenanceRecord type compiles', () => {
    const r: MaintenanceRecord = {
      id: '1',
      org_id: '1',
      vehicle_id: '1',
      maintenance_type: 'oil_change',
      description: 'test',
      vendor_name: null,
      vendor_location: null,
      odometer_at_service: null,
      cost_parts: 0,
      cost_labor: 0,
      cost_total: 0,
      warranty_covered: false,
      date_in: '2026-03-20',
      date_out: null,
      downtime_days: null,
      document_urls: null,
      next_service_odometer: null,
      next_service_date: null,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    }
    expect(r.maintenance_type).toBe('oil_change')
  })

  it('FuelTransaction type compiles', () => {
    const f: FuelTransaction = {
      id: '1',
      org_id: '1',
      vehicle_id: '1',
      driver_id: null,
      transaction_date: '2026-03-20',
      location: null,
      city: null,
      state: null,
      gallons: 120,
      price_per_gallon: null,
      total_cost: 480,
      odometer_reading: null,
      receipt_url: null,
      source: 'manual',
      created_at: '2026-01-01',
    }
    expect(f.source).toBe('manual')
  })

  it('MaintenanceSchedule type compiles', () => {
    const s: MaintenanceSchedule = {
      id: '1',
      org_id: '1',
      vehicle_id: null,
      vehicle_class: null,
      maintenance_type: 'oil_change',
      interval_miles: 15000,
      interval_days: null,
      description: null,
      estimated_cost: null,
      priority: 'normal',
      active: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    }
    expect(s.priority).toBe('normal')
  })

  it('VehicleAssignment type compiles', () => {
    const a: VehicleAssignment = {
      id: '1',
      org_id: '1',
      vehicle_id: '1',
      driver_id: '1',
      assigned_at: '2026-01-01',
      unassigned_at: null,
      reason: null,
      created_at: '2026-01-01',
    }
    expect(a.assigned_at).toBe('2026-01-01')
  })
})
