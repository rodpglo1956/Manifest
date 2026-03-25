// AUTH-03: User can log in via magic link as alternative to password
import { describe, test } from 'vitest'

describe('Auth - Magic Link', () => {
  test.todo('should send magic link OTP to valid email')
  test.todo('should show confirmation message after sending')
  test.todo('should handle rate limiting (60s between requests)')
  test.todo('should create session after magic link verification')
})
