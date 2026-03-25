// AUTH-06: Admin can invite users to join their organization with role assignment
// AUTH-07: Invited users can join an existing organization via invitation link
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { inviteSchema } from '@/schemas/invite'

describe('Auth - Invitation', () => {
  describe('inviteSchema validation (AUTH-06)', () => {
    test('should accept valid email and role', () => {
      const result = inviteSchema.safeParse({
        email: 'driver@example.com',
        role: 'driver',
      })
      expect(result.success).toBe(true)
    })

    test('should accept all valid roles', () => {
      const roles = ['admin', 'dispatcher', 'driver', 'viewer']
      for (const role of roles) {
        const result = inviteSchema.safeParse({
          email: 'test@example.com',
          role,
        })
        expect(result.success).toBe(true)
      }
    })

    test('should reject missing email', () => {
      const result = inviteSchema.safeParse({
        role: 'driver',
      })
      expect(result.success).toBe(false)
    })

    test('should reject invalid email', () => {
      const result = inviteSchema.safeParse({
        email: 'not-an-email',
        role: 'driver',
      })
      expect(result.success).toBe(false)
    })

    test('should reject invalid role', () => {
      const result = inviteSchema.safeParse({
        email: 'test@example.com',
        role: 'superadmin',
      })
      expect(result.success).toBe(false)
    })

    test('should reject missing role', () => {
      const result = inviteSchema.safeParse({
        email: 'test@example.com',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('Invitation flow (AUTH-06/07)', () => {
    test('should validate invitation email format', () => {
      const validResult = inviteSchema.safeParse({
        email: 'valid@company.com',
        role: 'dispatcher',
      })
      expect(validResult.success).toBe(true)
      if (validResult.success) {
        expect(validResult.data.email).toBe('valid@company.com')
        expect(validResult.data.role).toBe('dispatcher')
      }
    })

    test('should enforce role options match UserRole type', () => {
      // These should all parse successfully
      const roles = ['admin', 'dispatcher', 'driver', 'viewer'] as const
      for (const role of roles) {
        const result = inviteSchema.safeParse({
          email: 'test@example.com',
          role,
        })
        expect(result.success).toBe(true)
      }

      // These should fail
      const invalidRoles = ['owner', 'manager', 'superadmin', '']
      for (const role of invalidRoles) {
        const result = inviteSchema.safeParse({
          email: 'test@example.com',
          role,
        })
        expect(result.success).toBe(false)
      }
    })
  })
})
