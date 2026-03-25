// POST /api/billing/create-checkout
// Creates a Stripe checkout session for plan subscription
// Returns { url } for client-side redirect

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/billing/stripe'
import type { BillingPlan, BillingCycle } from '@/types/database'

const VALID_PLANS: BillingPlan[] = ['starter', 'professional']
const VALID_CYCLES: BillingCycle[] = ['monthly', 'annual']

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

  // Get org name for Stripe customer
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', profile.org_id)
    .single()

  // Parse and validate request body
  let body: { plan: BillingPlan; billingCycle: BillingCycle }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { plan, billingCycle } = body

  if (!VALID_PLANS.includes(plan)) {
    return NextResponse.json(
      { error: 'Invalid plan. Use starter or professional. Enterprise requires contacting sales.' },
      { status: 400 }
    )
  }

  if (!VALID_CYCLES.includes(billingCycle)) {
    return NextResponse.json(
      { error: 'Invalid billing cycle. Use monthly or annual.' },
      { status: 400 }
    )
  }

  try {
    const origin = request.nextUrl.origin
    const url = await createCheckoutSession(
      profile.org_id,
      org?.name || 'Organization',
      user.email || '',
      plan,
      billingCycle,
      `${origin}/settings/billing?session_id={CHECKOUT_SESSION_ID}`,
      `${origin}/settings/billing?canceled=true`
    )

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Checkout session error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
