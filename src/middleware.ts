import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { determineRoute } from '@/lib/middleware/routing'

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse, claims, error } = await updateSession(request)
  const { pathname } = request.nextUrl

  // For public and auth routes without a session, use fast path (no profile query)
  const needsProfile = !!(claims && !error)

  let profile: { role: string; org_id: string | null } | null = null

  if (needsProfile) {
    const { data } = await supabase
      .from('profiles')
      .select('role, org_id')
      .eq('id', claims.sub)
      .single()
    profile = data
  }

  const result = determineRoute({ pathname, claims, error, profile })

  if (result.redirect) {
    return NextResponse.redirect(new URL(result.redirect, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
