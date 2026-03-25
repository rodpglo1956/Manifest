// AUTH-05: User can create a new organization with company details
import { describe, test, expect } from 'vitest'
import { organizationSchema } from '@/schemas/organization'

describe('Organization - Schema Validation', () => {
  test('should pass with all valid fields', () => {
    const result = organizationSchema.safeParse({
      name: 'Acme Trucking',
      address_line1: '123 Main St',
      address_city: 'Dallas',
      address_state: 'TX',
      address_zip: '75201',
      phone: '555-123-4567',
      email: 'info@acme.com',
      dot_number: 'USDOT1234567',
      mc_number: 'MC-123456',
      company_type: 'dot_carrier',
    })
    expect(result.success).toBe(true)
  })

  test('should pass with only required fields (name and company_type)', () => {
    const result = organizationSchema.safeParse({
      name: 'Simple Carrier',
      company_type: 'non_dot_carrier',
    })
    expect(result.success).toBe(true)
  })

  test('should fail when name is missing', () => {
    const result = organizationSchema.safeParse({
      name: '',
      company_type: 'dot_carrier',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameError = result.error.issues.find((i) =>
        i.path.includes('name')
      )
      expect(nameError?.message).toBe('Company name is required')
    }
  })

  test('should fail with invalid company_type', () => {
    const result = organizationSchema.safeParse({
      name: 'Test Co',
      company_type: 'invalid_type',
    })
    expect(result.success).toBe(false)
  })

  test('should accept all three valid company types', () => {
    for (const type of ['dot_carrier', 'non_dot_carrier', 'both']) {
      const result = organizationSchema.safeParse({
        name: 'Test Co',
        company_type: type,
      })
      expect(result.success).toBe(true)
    }
  })

  test('should accept alphanumeric DOT and MC numbers', () => {
    const result = organizationSchema.safeParse({
      name: 'Test Carrier',
      company_type: 'dot_carrier',
      dot_number: 'USDOT1234567',
      mc_number: 'MC-654321',
    })
    expect(result.success).toBe(true)
  })

  test('should enforce max length on address_state (2 chars)', () => {
    const result = organizationSchema.safeParse({
      name: 'Test Co',
      company_type: 'dot_carrier',
      address_state: 'Texas',
    })
    expect(result.success).toBe(false)
  })
})
