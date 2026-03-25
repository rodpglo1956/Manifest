// CSRF token generation and validation
// Uses httpOnly cookie + X-CSRF-Token header double-submit pattern

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const CSRF_COOKIE = 'csrf_token'
const CSRF_HEADER = 'X-CSRF-Token'

/**
 * Generate a new CSRF token and set it as an httpOnly cookie
 * Returns the token value for inclusion in forms/headers
 */
export async function generateCsrfToken(): Promise<string> {
  const token = crypto.randomUUID()
  const cookieStore = await cookies()
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  })
  return token
}

/**
 * Validate the CSRF token from the request header against the cookie value
 * Returns true if tokens match, false otherwise
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const headerToken = request.headers.get(CSRF_HEADER)
  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value

  if (!headerToken || !cookieToken) {
    return false
  }

  return headerToken === cookieToken
}

/**
 * Wrapper for API route handlers that auto-validates CSRF on mutation methods
 * Usage: export const POST = withCsrf(async (request) => { ... })
 */
export function withCsrf(
  handler: (request: NextRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const mutationMethods = ['POST', 'PUT', 'DELETE', 'PATCH']

    if (mutationMethods.includes(request.method)) {
      if (!validateCsrfToken(request)) {
        return NextResponse.json(
          { error: 'Invalid or missing CSRF token' },
          { status: 403 }
        )
      }
    }

    return handler(request)
  }
}
