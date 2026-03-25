// AUTH-09: Middleware redirects users to correct mode based on role
import { describe, test, expect, vi, beforeEach } from 'vitest'

// Test the routing decision logic extracted from middleware
// We test determineRoute() as a pure function rather than full middleware integration

type RoutingInput = {
  pathname: string
  claims: { sub: string } | null
  error: Error | null
  profile: { role: string; org_id: string | null } | null
}

type RoutingResult = {
  redirect: string | null // null means allow through
}

// Import will be available after GREEN phase
import { determineRoute } from '@/lib/middleware/routing'

describe('Middleware - Role Routing', () => {
  describe('Public routes', () => {
    test('should allow access to public marketing routes', () => {
      const result = determineRoute({
        pathname: '/',
        claims: null,
        error: null,
        profile: null,
      })
      expect(result.redirect).toBeNull()
    })

    test('should allow access to /login without session', () => {
      const result = determineRoute({
        pathname: '/login',
        claims: null,
        error: null,
        profile: null,
      })
      expect(result.redirect).toBeNull()
    })

    test('should allow access to /signup without session', () => {
      const result = determineRoute({
        pathname: '/signup',
        claims: null,
        error: null,
        profile: null,
      })
      expect(result.redirect).toBeNull()
    })

    test('should allow access to /callback', () => {
      const result = determineRoute({
        pathname: '/callback',
        claims: null,
        error: null,
        profile: null,
      })
      expect(result.redirect).toBeNull()
    })
  })

  describe('Unauthenticated access to protected routes', () => {
    test('should redirect unauthenticated user to login from /dashboard', () => {
      const result = determineRoute({
        pathname: '/dashboard',
        claims: null,
        error: null,
        profile: null,
      })
      expect(result.redirect).toBe('/login')
    })

    test('should redirect unauthenticated user to login from /driver/dashboard', () => {
      const result = determineRoute({
        pathname: '/driver/dashboard',
        claims: null,
        error: null,
        profile: null,
      })
      expect(result.redirect).toBe('/login')
    })

    test('should redirect user with auth error to login', () => {
      const result = determineRoute({
        pathname: '/dashboard',
        claims: { sub: 'user-1' },
        error: new Error('token expired'),
        profile: null,
      })
      expect(result.redirect).toBe('/login')
    })
  })

  describe('Authenticated user without org', () => {
    test('should redirect user without org to onboarding', () => {
      const result = determineRoute({
        pathname: '/dashboard',
        claims: { sub: 'user-1' },
        error: null,
        profile: { role: 'admin', org_id: null },
      })
      expect(result.redirect).toBe('/onboarding')
    })
  })

  describe('Role-based routing', () => {
    test('should redirect driver to Driver PWA from /dashboard', () => {
      const result = determineRoute({
        pathname: '/dashboard',
        claims: { sub: 'user-1' },
        error: null,
        profile: { role: 'driver', org_id: 'org-1' },
      })
      expect(result.redirect).toBe('/driver/dashboard')
    })

    test('should redirect driver from /settings/team to /driver/dashboard', () => {
      const result = determineRoute({
        pathname: '/settings/team',
        claims: { sub: 'user-1' },
        error: null,
        profile: { role: 'driver', org_id: 'org-1' },
      })
      expect(result.redirect).toBe('/driver/dashboard')
    })

    test('should redirect admin from /driver/dashboard to /dashboard', () => {
      const result = determineRoute({
        pathname: '/driver/dashboard',
        claims: { sub: 'user-1' },
        error: null,
        profile: { role: 'admin', org_id: 'org-1' },
      })
      expect(result.redirect).toBe('/dashboard')
    })

    test('should redirect dispatcher from /driver/dashboard to /dashboard', () => {
      const result = determineRoute({
        pathname: '/driver/dashboard',
        claims: { sub: 'user-1' },
        error: null,
        profile: { role: 'dispatcher', org_id: 'org-1' },
      })
      expect(result.redirect).toBe('/dashboard')
    })

    test('should allow admin to access /dashboard', () => {
      const result = determineRoute({
        pathname: '/dashboard',
        claims: { sub: 'user-1' },
        error: null,
        profile: { role: 'admin', org_id: 'org-1' },
      })
      expect(result.redirect).toBeNull()
    })

    test('should allow dispatcher to access /dashboard', () => {
      const result = determineRoute({
        pathname: '/dashboard',
        claims: { sub: 'user-1' },
        error: null,
        profile: { role: 'dispatcher', org_id: 'org-1' },
      })
      expect(result.redirect).toBeNull()
    })

    test('should allow viewer to access /dashboard (read-only)', () => {
      const result = determineRoute({
        pathname: '/dashboard',
        claims: { sub: 'user-1' },
        error: null,
        profile: { role: 'viewer', org_id: 'org-1' },
      })
      expect(result.redirect).toBeNull()
    })

    test('should allow driver to access /driver/dashboard', () => {
      const result = determineRoute({
        pathname: '/driver/dashboard',
        claims: { sub: 'user-1' },
        error: null,
        profile: { role: 'driver', org_id: 'org-1' },
      })
      expect(result.redirect).toBeNull()
    })
  })

  describe('Auth routes with valid session', () => {
    test('should redirect admin on /login to /dashboard', () => {
      const result = determineRoute({
        pathname: '/login',
        claims: { sub: 'user-1' },
        error: null,
        profile: { role: 'admin', org_id: 'org-1' },
      })
      expect(result.redirect).toBe('/dashboard')
    })

    test('should redirect driver on /login to /driver/dashboard', () => {
      const result = determineRoute({
        pathname: '/login',
        claims: { sub: 'user-1' },
        error: null,
        profile: { role: 'driver', org_id: 'org-1' },
      })
      expect(result.redirect).toBe('/driver/dashboard')
    })

    test('should redirect user without org on /login to /onboarding', () => {
      const result = determineRoute({
        pathname: '/login',
        claims: { sub: 'user-1' },
        error: null,
        profile: { role: 'admin', org_id: null },
      })
      expect(result.redirect).toBe('/onboarding')
    })

    test('should redirect user on /signup to appropriate dashboard', () => {
      const result = determineRoute({
        pathname: '/signup',
        claims: { sub: 'user-1' },
        error: null,
        profile: { role: 'dispatcher', org_id: 'org-1' },
      })
      expect(result.redirect).toBe('/dashboard')
    })
  })
})
