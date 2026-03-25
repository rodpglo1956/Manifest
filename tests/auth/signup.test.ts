// AUTH-01: User can sign up with email and password
import { describe, test, expect } from 'vitest'
import { signupSchema } from '@/schemas/auth'

describe('Auth - Signup Schema', () => {
  test('should pass with valid email, password, and fullName', () => {
    const result = signupSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      fullName: 'John Doe',
    })
    expect(result.success).toBe(true)
  })

  test('should fail when email is missing', () => {
    const result = signupSchema.safeParse({
      email: '',
      password: 'password123',
      fullName: 'John Doe',
    })
    expect(result.success).toBe(false)
  })

  test('should fail when email is invalid', () => {
    const result = signupSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
      fullName: 'John Doe',
    })
    expect(result.success).toBe(false)
  })

  test('should fail when password is too short', () => {
    const result = signupSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
      fullName: 'John Doe',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const pwdError = result.error.issues.find((i) => i.path.includes('password'))
      expect(pwdError?.message).toBe('Password must be at least 8 characters')
    }
  })

  test('should fail when fullName is empty', () => {
    const result = signupSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      fullName: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path.includes('fullName'))
      expect(nameError?.message).toBe('Name is required')
    }
  })
})
