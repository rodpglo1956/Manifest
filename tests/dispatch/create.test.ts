import { describe, it, expect } from 'vitest'
import { createDispatchSchema } from '@/schemas/dispatch'

describe('createDispatchSchema', () => {
  it('validates a complete valid input', () => {
    const input = {
      load_id: '550e8400-e29b-41d4-a716-446655440000',
      driver_id: '660e8400-e29b-41d4-a716-446655440001',
      vehicle_id: '770e8400-e29b-41d4-a716-446655440002',
      dispatcher_notes: 'Handle with care',
    }
    const result = createDispatchSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('validates with only required fields', () => {
    const input = {
      load_id: '550e8400-e29b-41d4-a716-446655440000',
      driver_id: '660e8400-e29b-41d4-a716-446655440001',
    }
    const result = createDispatchSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('rejects missing load_id', () => {
    const input = {
      driver_id: '660e8400-e29b-41d4-a716-446655440001',
    }
    const result = createDispatchSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects missing driver_id', () => {
    const input = {
      load_id: '550e8400-e29b-41d4-a716-446655440000',
    }
    const result = createDispatchSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects invalid load_id (not UUID)', () => {
    const input = {
      load_id: 'not-a-uuid',
      driver_id: '660e8400-e29b-41d4-a716-446655440001',
    }
    const result = createDispatchSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects invalid driver_id (not UUID)', () => {
    const input = {
      load_id: '550e8400-e29b-41d4-a716-446655440000',
      driver_id: 'invalid',
    }
    const result = createDispatchSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('accepts optional vehicle_id as undefined', () => {
    const input = {
      load_id: '550e8400-e29b-41d4-a716-446655440000',
      driver_id: '660e8400-e29b-41d4-a716-446655440001',
    }
    const result = createDispatchSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.vehicle_id).toBeUndefined()
    }
  })

  it('rejects invalid vehicle_id (not UUID)', () => {
    const input = {
      load_id: '550e8400-e29b-41d4-a716-446655440000',
      driver_id: '660e8400-e29b-41d4-a716-446655440001',
      vehicle_id: 'bad',
    }
    const result = createDispatchSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('defaults dispatcher_notes to empty string', () => {
    const input = {
      load_id: '550e8400-e29b-41d4-a716-446655440000',
      driver_id: '660e8400-e29b-41d4-a716-446655440001',
    }
    const result = createDispatchSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.dispatcher_notes).toBe('')
    }
  })
})
