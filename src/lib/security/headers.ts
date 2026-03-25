// Security headers applied to every response via middleware
// Includes CSP, frame protection, XSS protection, and referrer policy

/**
 * Security headers object to apply to all responses
 * CSP allows Next.js requirements (unsafe-inline, unsafe-eval for dev),
 * Supabase connections, Mapbox, and Stripe
 */
export const securityHeaders: Record<string, string> = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mapbox.com https://api.stripe.com",
    "frame-src https://js.stripe.com https://checkout.stripe.com",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(self)',
}
