// AUTH-02: User can log in and stay logged in across sessions
import { describe, test } from 'vitest'

describe('Auth - Session', () => {
  test.todo('should persist session across page loads')
  test.todo('should refresh expired access token via middleware')
  test.todo('should redirect to login when session is invalid')
  test.todo('should clear session on sign out')
})
