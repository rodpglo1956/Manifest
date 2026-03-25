import { describe, it, expect } from 'vitest'
import { dvirSchema, DVIR_INSPECTION_ITEMS } from '@/lib/compliance/dvir-schema'

describe('DVIR_INSPECTION_ITEMS', () => {
  it('contains exactly 11 FMCSA inspection items', () => {
    expect(DVIR_INSPECTION_ITEMS).toHaveLength(11)
  })

  it('includes all required FMCSA items', () => {
    const itemIds = DVIR_INSPECTION_ITEMS.map((item) => item.id)
    expect(itemIds).toContain('service_brakes')
    expect(itemIds).toContain('parking_brake')
    expect(itemIds).toContain('steering')
    expect(itemIds).toContain('lighting')
    expect(itemIds).toContain('tires')
    expect(itemIds).toContain('horn')
    expect(itemIds).toContain('wipers')
    expect(itemIds).toContain('mirrors')
    expect(itemIds).toContain('coupling')
    expect(itemIds).toContain('wheels_rims')
    expect(itemIds).toContain('emergency_equipment')
  })
})

describe('dvirSchema', () => {
  const validInput = {
    vehicle_id: '550e8400-e29b-41d4-a716-446655440000',
    inspection_type: 'pre_trip' as const,
    items: {
      service_brakes: 'pass' as const,
      parking_brake: 'pass' as const,
      steering: 'pass' as const,
      lighting: 'pass' as const,
      tires: 'pass' as const,
      horn: 'pass' as const,
      wipers: 'pass' as const,
      mirrors: 'pass' as const,
      coupling: 'pass' as const,
      wheels_rims: 'pass' as const,
      emergency_equipment: 'pass' as const,
    },
    defects: [],
  }

  it('accepts a valid 11-item pass/fail record with vehicle_id and inspection_type', () => {
    const result = dvirSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('accepts valid input with optional fields', () => {
    const result = dvirSchema.safeParse({
      ...validInput,
      notes: 'All clear',
      odometer: 125000,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing vehicle_id', () => {
    const { vehicle_id, ...rest } = validInput
    const result = dvirSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects invalid inspection_type', () => {
    const result = dvirSchema.safeParse({
      ...validInput,
      inspection_type: 'annual',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty items record', () => {
    const result = dvirSchema.safeParse({
      ...validInput,
      items: {},
    })
    expect(result.success).toBe(false)
  })

  it('requires defect description when item is marked fail', () => {
    const input = {
      ...validInput,
      items: {
        ...validInput.items,
        tires: 'fail' as const,
      },
      defects: [{ item_id: 'tires', description: 'Left front tire tread below minimum' }],
    }
    const result = dvirSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('fails when item marked fail but no matching defect', () => {
    const input = {
      ...validInput,
      items: {
        ...validInput.items,
        tires: 'fail' as const,
      },
      defects: [],
    }
    const result = dvirSchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})
