// In-memory sliding window rate limiter
// Uses Map for O(1) lookups with periodic cleanup

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000

let cleanupTimer: ReturnType<typeof setInterval> | null = null

function startCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) {
        store.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)
  // Allow Node.js to exit even with the timer running
  if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref()
  }
}

/**
 * Check rate limit for an identifier (IP address or user ID)
 * @param identifier - Unique key for the rate limit (e.g., IP address)
 * @param limit - Maximum requests per window (default: 100)
 * @param windowMs - Window duration in milliseconds (default: 60000 = 1 minute)
 */
export function rateLimit(
  identifier: string,
  limit = 100,
  windowMs = 60000
): RateLimitResult {
  startCleanup()

  const now = Date.now()
  const entry = store.get(identifier)

  // If no entry or window expired, start fresh
  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs
    store.set(identifier, { count: 1, resetAt })
    return { success: true, remaining: limit - 1, resetAt }
  }

  // Increment count
  entry.count++

  if (entry.count > limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

/**
 * Stricter rate limit for auth endpoints (10 req/min)
 */
export function authRateLimit(identifier: string): RateLimitResult {
  return rateLimit(identifier, 10, 60000)
}

/**
 * Get client IP from request headers
 */
function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

/**
 * Wrapper for API route handlers that applies rate limiting
 * Usage: export const POST = withRateLimit(handler, { limit: 50 })
 */
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  options?: { limit?: number; windowMs?: number }
): (request: Request) => Promise<Response> {
  const { limit = 100, windowMs = 60000 } = options || {}

  return async (request: Request) => {
    const ip = getClientIp(request)
    const result = rateLimit(ip, limit, windowMs)

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: 'Too many requests' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(result.resetAt),
          },
        }
      )
    }

    return handler(request)
  }
}
