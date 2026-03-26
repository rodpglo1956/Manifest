// Pure routing decision logic for middleware
// Extracted for testability -- no Next.js or Supabase dependencies

type RoutingInput = {
  pathname: string
  claims: { sub: string } | null
  error: Error | null
  profile: { role: string; org_id: string | null; is_onboarded?: boolean } | null
}

type RoutingResult = {
  redirect: string | null // null means allow through
}

const PUBLIC_ROUTES = ['/callback']
const AUTH_ROUTES = ['/login', '/signup']

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/callback')
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route))
}

function isDriverRoute(pathname: string): boolean {
  return pathname.startsWith('/driver')
}

function isCommandRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/loads') ||
    pathname.startsWith('/dispatch') ||
    pathname.startsWith('/invoices')
  )
}

function getDashboardForRole(role: string): string {
  return role === 'driver' ? '/driver/dashboard' : '/dashboard'
}

export function determineRoute(input: RoutingInput): RoutingResult {
  const { pathname, claims, error, profile } = input

  // Public routes -- no auth needed
  if (isPublicRoute(pathname)) {
    return { redirect: null }
  }

  // Auth routes -- redirect to app if already logged in
  if (isAuthRoute(pathname)) {
    if (claims && !error) {
      if (!profile?.org_id) {
        return { redirect: '/onboarding' }
      }
      return { redirect: getDashboardForRole(profile.role) }
    }
    return { redirect: null }
  }

  // Protected routes -- require auth
  if (!claims || error) {
    return { redirect: '/login' }
  }

  // Authenticated but no org -- allow onboarding routes through
  if (!profile?.org_id) {
    if (pathname.startsWith('/onboarding')) {
      return { redirect: null }
    }
    return { redirect: '/onboarding' }
  }

  // Allow onboarding routes through for any authenticated user
  if (pathname.startsWith('/onboarding')) {
    return { redirect: null }
  }

  // Driver not yet onboarded -- redirect to driver onboarding
  if (profile.role === 'driver' && profile.is_onboarded === false) {
    return { redirect: '/onboarding/driver' }
  }

  // Driver trying to access Command mode routes
  if (profile.role === 'driver' && isCommandRoute(pathname)) {
    return { redirect: '/driver/dashboard' }
  }

  // Non-driver trying to access Driver PWA routes
  if (profile.role !== 'driver' && isDriverRoute(pathname)) {
    return { redirect: '/dashboard' }
  }

  // Allowed
  return { redirect: null }
}
