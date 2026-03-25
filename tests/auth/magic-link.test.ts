// AUTH-03: User can log in via magic link as alternative to password
import { describe, test, expect } from 'vitest'
import { magicLinkSchema } from '@/schemas/auth'

describe('Auth - Magic Link Schema', () => {
  test('should pass with valid email', () => {
    const result = magicLinkSchema.safeParse({
      email: 'user@example.com',
    })
    expect(result.success).toBe(true)
  })

  test('should fail when email is missing', () => {
    const result = magicLinkSchema.safeParse({
      email: '',
    })
    expect(result.success).toBe(false)
  })

  test('should fail when email is invalid', () => {
    const result = magicLinkSchema.safeParse({
      email: 'not-valid',
    })
    expect(result.success).toBe(false)
  })
})

describe('Auth - Login Schema', () => {
  // loginSchema is also part of this test file
  test('should pass with valid email and password', async () => {
    const { loginSchema } = await import('@/schemas/auth')
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'mypassword',
    })
    expect(result.success).toBe(true)
  })

  test('should fail when password is empty', async () => {
    const { loginSchema } = await import('@/schemas/auth')
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})
