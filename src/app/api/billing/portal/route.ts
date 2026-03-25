// POST /api/billing/portal
// Creates a Stripe customer portal session for payment method management
// Returns { url } for client-side redirect

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPortalSession } from '@/lib/billing/stripe'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get org context
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 })
  }

  try {
    const origin = request.nextUrl.origin
    const url = await createPortalSession(
      profile.org_id,
      `${origin}/settings/billing`
    )

    return NextResponse.json({ url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create portal session'

    // No Stripe customer = no subscription yet
    if (message.includes('No Stripe customer')) {
      return NextResponse.json(
        { error: 'No active subscription. Please subscribe to a plan first.' },
        { status: 402 }
      )
    }

    console.error('Portal session error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
