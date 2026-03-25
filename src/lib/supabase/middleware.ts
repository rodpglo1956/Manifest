// Middleware session refresh utility using getClaims()
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
// CRITICAL: Uses getClaims() not getUser() -- getClaims validates JWT locally
// using cached JWKS (no network request). getUser() would make a network
// request to Supabase Auth on every middleware invocation.
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session -- getClaims validates JWT locally (fast)
  const { data, error } = await supabase.auth.getClaims()
  const claims = data?.claims ?? null

  return { supabase, supabaseResponse, claims, error }
}
