import { describe, it, expect } from 'vitest'
import { vehicleSchema } from '@/schemas/vehicle'

describe('Vehicle Schema', () => {
  it('validates a complete vehicle', () => {
    const result = vehicleSchema.safeParse({
      unit_number: 'T-101',
      vin: '1HGBH41JXMN109186',
      year: 2023,
      make: 'Freightliner',
      model: 'Cascadia',
      vehicle_type: 'dry_van',
      status: 'active',
    })
    expect(result.success).toBe(true)
  })

  it('requires unit_number', () => {
    const result = vehicleSchema.safeParse({
      year: 2023,
      make: 'Freightliner',
      model: 'Cascadia',
      vehicle_type: 'dry_van',
    })
    expect(result.success).toBe(false)
  })

  it('requires make', () => {
    const result = vehicleSchema.safeParse({
      unit_number: 'T-101',
      year: 2023,
      model: 'Cascadia',
      vehicle_type: 'dry_van',
    })
    expect(result.success).toBe(false)
  })

  it('requires model', () => {
    const result = vehicleSchema.safeParse({
      unit_number: 'T-101',
      year: 2023,
      make: 'Freightliner',
      vehicle_type: 'dry_van',
    })
    expect(result.success).toBe(false)
  })

  it('validates VIN is exactly 17 characters when provided', () => {
    const result = vehicleSchema.safeParse({
      unit_number: 'T-101',
      vin: 'TOOSHORT',
      year: 2023,
      make: 'Freightliner',
      model: 'Cascadia',
      vehicle_type: 'dry_van',
    })
    expect(result.success).toBe(false)
  })

  it('allows empty VIN', () => {
    const result = vehicleSchema.safeParse({
      unit_number: 'T-101',
      vin: '',
      year: 2023,
      make: 'Freightliner',
      model: 'Cascadia',
      vehicle_type: 'dry_van',
    })
    expect(result.success).toBe(true)
  })

  it('validates year range', () => {
    const tooOld = vehicleSchema.safeParse({
      unit_number: 'T-101',
      year: 1899,
      make: 'Freightliner',
      model: 'Cascadia',
      vehicle_type: 'dry_van',
    })
    expect(tooOld.success).toBe(false)

    const tooNew = vehicleSchema.safeParse({
      unit_number: 'T-101',
      year: 2101,
      make: 'Freightliner',
      model: 'Cascadia',
      vehicle_type: 'dry_van',
    })
    expect(tooNew.success).toBe(false)
  })

  it('validates vehicle_type enum', () => {
    const result = vehicleSchema.safeParse({
      unit_number: 'T-101',
      year: 2023,
      make: 'Freightliner',
      model: 'Cascadia',
      vehicle_type: 'tank',
    })
    expect(result.success).toBe(false)
  })

  it('defaults status to active', () => {
    const result = vehicleSchema.parse({
      unit_number: 'T-101',
      year: 2023,
      make: 'Freightliner',
      model: 'Cascadia',
      vehicle_type: 'dry_van',
    })
    expect(result.status).toBe('active')
  })
})
