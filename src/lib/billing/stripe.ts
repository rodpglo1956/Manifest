// Stripe client singleton and billing helper functions
// SERVER ONLY -- never import in client components

import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { PLAN_CONFIG } from '@/lib/billing/plans'
import type { BillingPlan, BillingCycle } from '@/types/database'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
  typescript: true,
})

/**
 * Get or create a Stripe customer for an organization.
 * Stores stripe_customer_id in billing_accounts for future lookups.
 */
export async function getOrCreateStripeCustomer(
  orgId: string,
  orgName: string,
  email: string
): Promise<string> {
  // Check if org already has a Stripe customer
  const { data: account } = await supabaseAdmin
    .from('billing_accounts')
    .select('stripe_customer_id')
    .eq('org_id', orgId)
    .single()

  if (account?.stripe_customer_id) {
    return account.stripe_customer_id
  }

  // Create Stripe customer
  const customer = await stripe.customers.create({
    name: orgName,
    email,
    metadata: { org_id: orgId },
  })

  // Store customer ID
  await supabaseAdmin
    .from('billing_accounts')
    .update({ stripe_customer_id: customer.id })
    .eq('org_id', orgId)

  return customer.id
}

/**
 * Create a Stripe checkout session for a subscription plan upgrade.
 * Returns the checkout session URL for redirect.
 */
export async function createCheckoutSession(
  orgId: string,
  orgName: string,
  email: string,
  plan: BillingPlan,
  billingCycle: BillingCycle,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const customerId = await getOrCreateStripeCustomer(orgId, orgName, email)

  const planConfig = PLAN_CONFIG[plan]
  const priceId = planConfig.stripePriceId?.[billingCycle]

  if (!priceId) {
    throw new Error(`No Stripe price ID configured for ${plan} (${billingCycle})`)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: { org_id: orgId, plan },
    },
    metadata: { org_id: orgId, plan },
  })

  if (!session.url) {
    throw new Error('Failed to create checkout session URL')
  }

  return session.url
}

/**
 * Create a Stripe customer portal session for payment method management.
 * Returns the portal session URL for redirect.
 */
export async function createPortalSession(
  orgId: string,
  returnUrl: string
): Promise<string> {
  const { data: account } = await supabaseAdmin
    .from('billing_accounts')
    .select('stripe_customer_id')
    .eq('org_id', orgId)
    .single()

  if (!account?.stripe_customer_id) {
    throw new Error('No Stripe customer found for this organization')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: account.stripe_customer_id,
    return_url: returnUrl,
  })

  return session.url
}
