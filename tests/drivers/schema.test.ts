import { describe, it, expect } from 'vitest'
import { driverSchema, driverUpdateSchema } from '@/schemas/driver'

describe('Driver Schema', () => {
  it('validates a complete driver', () => {
    const result = driverSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
      phone: '555-123-4567',
      email: 'john@example.com',
      license_number: 'DL12345',
      license_state: 'TX',
      license_class: 'A',
      status: 'active',
    })
    expect(result.success).toBe(true)
  })

  it('requires first_name', () => {
    const result = driverSchema.safeParse({
      last_name: 'Doe',
      phone: '555-123-4567',
    })
    expect(result.success).toBe(false)
  })

  it('requires last_name', () => {
    const result = driverSchema.safeParse({
      first_name: 'John',
      phone: '555-123-4567',
    })
    expect(result.success).toBe(false)
  })

  it('requires phone', () => {
    const result = driverSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
    })
    expect(result.success).toBe(false)
  })

  it('validates license_state is 2 characters when provided', () => {
    const result = driverSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
      phone: '555-123-4567',
      license_state: 'Texas',
    })
    expect(result.success).toBe(false)
  })

  it('allows empty license_state', () => {
    const result = driverSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
      phone: '555-123-4567',
      license_state: '',
    })
    expect(result.success).toBe(true)
  })

  it('defaults status to active', () => {
    const result = driverSchema.parse({
      first_name: 'John',
      last_name: 'Doe',
      phone: '555-123-4567',
    })
    expect(result.status).toBe('active')
  })

  it('validates license_class enum', () => {
    const result = driverSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
      phone: '555-123-4567',
      license_class: 'X',
    })
    expect(result.success).toBe(false)
  })

  it('allows partial updates via driverUpdateSchema', () => {
    const result = driverUpdateSchema.safeParse({
      phone: '555-999-8888',
    })
    expect(result.success).toBe(true)
  })
})
