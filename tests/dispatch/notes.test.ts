import { describe, it, expect } from 'vitest'
import { driverNotesSchema } from '@/schemas/dispatch'

describe('driverNotesSchema', () => {
  it('validates valid input', () => {
    const input = {
      dispatch_id: '550e8400-e29b-41d4-a716-446655440000',
      driver_notes: 'Arrived at dock 7, waiting for unload',
    }
    const result = driverNotesSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('rejects empty driver_notes', () => {
    const input = {
      dispatch_id: '550e8400-e29b-41d4-a716-446655440000',
      driver_notes: '',
    }
    const result = driverNotesSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects driver_notes longer than 1000 characters', () => {
    const input = {
      dispatch_id: '550e8400-e29b-41d4-a716-446655440000',
      driver_notes: 'x'.repeat(1001),
    }
    const result = driverNotesSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('accepts driver_notes at exactly 1000 characters', () => {
    const input = {
      dispatch_id: '550e8400-e29b-41d4-a716-446655440000',
      driver_notes: 'x'.repeat(1000),
    }
    const result = driverNotesSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('accepts driver_notes at exactly 1 character', () => {
    const input = {
      dispatch_id: '550e8400-e29b-41d4-a716-446655440000',
      driver_notes: 'x',
    }
    const result = driverNotesSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('rejects invalid dispatch_id', () => {
    const input = {
      dispatch_id: 'not-a-uuid',
      driver_notes: 'Some notes',
    }
    const result = driverNotesSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects missing dispatch_id', () => {
    const input = {
      driver_notes: 'Some notes',
    }
    const result = driverNotesSchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})
