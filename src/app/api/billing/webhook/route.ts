// POST /api/billing/webhook
// Stripe webhook handler for subscription lifecycle events
// Verifies Stripe signature, processes events, updates billing_accounts/billing_invoices

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/billing/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { BillingPlan, BillingStatus } from '@/types/database'

// Must use Node.js runtime for Stripe SDK
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Map Stripe subscription status to our BillingStatus enum
 */
function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): BillingStatus {
  switch (stripeStatus) {
    case 'trialing':
      return 'trialing'
    case 'active':
      return 'active'
    case 'past_due':
      return 'past_due'
    case 'canceled':
      return 'canceled'
    case 'paused':
      return 'paused'
    case 'unpaid':
      return 'unpaid'
    default:
      return 'active'
  }
}

/**
 * Extract org_id from subscription metadata
 */
function getOrgId(subscription: Stripe.Subscription): string | null {
  return (subscription.metadata?.org_id as string) || null
}

/**
 * Extract plan name from subscription metadata or default to starter
 */
function getPlan(subscription: Stripe.Subscription): BillingPlan {
  const plan = subscription.metadata?.plan as BillingPlan | undefined
  if (plan && ['free', 'starter', 'professional', 'enterprise'].includes(plan)) {
    return plan
  }
  return 'starter'
}

/**
 * Extract billing cycle from subscription interval
 */
function getBillingCycle(subscription: Stripe.Subscription): 'monthly' | 'annual' {
  const interval = subscription.items.data[0]?.price?.recurring?.interval
  return interval === 'year' ? 'annual' : 'monthly'
}

/**
 * Get current period dates from subscription items (Stripe 2024-12-18 API)
 */
function getSubscriptionPeriod(subscription: Stripe.Subscription): {
  periodStart: string
  periodEnd: string
} {
  const item = subscription.items.data[0]
  return {
    periodStart: new Date(item.current_period_start * 1000).toISOString(),
    periodEnd: new Date(item.current_period_end * 1000).toISOString(),
  }
}

/**
 * Extract subscription ID from invoice parent (Stripe 2024-12-18 API)
 */
function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const subDetails = invoice.parent?.subscription_details
  if (!subDetails?.subscription) return null
  return typeof subDetails.subscription === 'string'
    ? subDetails.subscription
    : subDetails.subscription.id
}

/**
 * Handle customer.subscription.created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const orgId = getOrgId(subscription)
  if (!orgId) {
    console.error('Webhook: subscription.created missing org_id in metadata')
    return
  }

  const plan = getPlan(subscription)
  const status = mapStripeStatus(subscription.status)
  const billingCycle = getBillingCycle(subscription)
  const period = getSubscriptionPeriod(subscription)

  await supabaseAdmin
    .from('billing_accounts')
    .update({
      plan,
      status,
      billing_cycle: billingCycle,
      stripe_subscription_id: subscription.id,
      current_period_start: period.periodStart,
      current_period_end: period.periodEnd,
    })
    .eq('org_id', orgId)
}

/**
 * Handle customer.subscription.updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const orgId = getOrgId(subscription)
  if (!orgId) {
    console.error('Webhook: subscription.updated missing org_id in metadata')
    return
  }

  const plan = getPlan(subscription)
  const status = mapStripeStatus(subscription.status)
  const billingCycle = getBillingCycle(subscription)
  const period = getSubscriptionPeriod(subscription)

  const updateData: Record<string, unknown> = {
    plan,
    status,
    billing_cycle: billingCycle,
    current_period_start: period.periodStart,
    current_period_end: period.periodEnd,
  }

  // Extract payment method details if available
  if (subscription.default_payment_method && typeof subscription.default_payment_method === 'object') {
    const pm = subscription.default_payment_method as Stripe.PaymentMethod
    if (pm.card) {
      updateData.payment_method_last4 = pm.card.last4
      updateData.payment_method_brand = pm.card.brand
    }
  }

  await supabaseAdmin
    .from('billing_accounts')
    .update(updateData)
    .eq('org_id', orgId)
}

/**
 * Handle customer.subscription.deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const orgId = getOrgId(subscription)
  if (!orgId) {
    console.error('Webhook: subscription.deleted missing org_id in metadata')
    return
  }

  await supabaseAdmin
    .from('billing_accounts')
    .update({
      status: 'canceled',
      plan: 'free',
      canceled_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)
}

/**
 * Handle invoice.paid -- record the billing invoice
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Get org_id from subscription metadata via the subscription
  const subscriptionId = getSubscriptionIdFromInvoice(invoice)
  if (!subscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const orgId = getOrgId(subscription)
  if (!orgId) return

  // Calculate tax from total_taxes array if available
  const taxAmount = invoice.total_taxes
    ? invoice.total_taxes.reduce((sum, t) => sum + (t.amount ?? 0), 0)
    : 0

  await supabaseAdmin
    .from('billing_invoices')
    .upsert(
      {
        org_id: orgId,
        stripe_invoice_id: invoice.id,
        amount: (invoice.amount_paid ?? 0) / 100,
        tax: taxAmount / 100,
        total: (invoice.total ?? 0) / 100,
        status: 'paid',
        paid_at: invoice.status_transitions?.paid_at
          ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
          : new Date().toISOString(),
        pdf_url: invoice.invoice_pdf || null,
        period_start: invoice.period_start
          ? new Date(invoice.period_start * 1000).toISOString()
          : null,
        period_end: invoice.period_end
          ? new Date(invoice.period_end * 1000).toISOString()
          : null,
      },
      { onConflict: 'stripe_invoice_id' }
    )
}

/**
 * Handle invoice.payment_failed -- mark account as past_due
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice)
  if (!subscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const orgId = getOrgId(subscription)
  if (!orgId) return

  await supabaseAdmin
    .from('billing_accounts')
    .update({ status: 'past_due' })
    .eq('org_id', orgId)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature verification failed'
    console.error('Webhook signature verification failed:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'customer.subscription.trial_will_end':
        // Will be wired to notification system in Phase 11
        console.log('Trial ending soon for subscription:', (event.data.object as Stripe.Subscription).id)
        break

      default:
        // Return 200 for unhandled events (Stripe best practice)
        break
    }
  } catch (error) {
    console.error(`Webhook handler error for ${event.type}:`, error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
