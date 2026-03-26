import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// DEV ONLY: Tests login flow using server-side Supabase client (same as login action uses)
export async function GET() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // ignore in read-only context
          }
        },
      },
    }
  )

  const email = 'rod@glomatrix.app'
  const password = 'manifest2026!'

  // Test 1: signInWithPassword
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json({
      step: 'signInWithPassword',
      success: false,
      error: error.message,
      error_code: error.code,
      status: error.status,
    })
  }

  // Test 2: Check session
  const { data: sessionData } = await supabase.auth.getSession()

  // Test 3: Check profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  return NextResponse.json({
    step: 'complete',
    success: true,
    user_id: data.user.id,
    email: data.user.email,
    has_session: !!sessionData?.session,
    profile: profile ? {
      org_id: profile.org_id,
      role: profile.role,
      full_name: profile.full_name,
    } : null,
    profile_error: profileError?.message || null,
    cookies_set: cookieStore.getAll().map(c => c.name).filter(n => n.startsWith('sb-')),
  })
}
