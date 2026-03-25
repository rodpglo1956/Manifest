'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  CreditCard,
  ExternalLink,
  FileText,
  AlertTriangle,
  Truck,
  Users,
  Package,
  Sparkles,
} from 'lucide-react'
import { PLAN_CONFIG } from '@/lib/billing/plans'
import type { BillingAccount, BillingInvoice, BillingPlan } from '@/types/database'
import type { UsageResource } from '@/lib/billing/enforce'

type UsageSummary = Record<UsageResource, { current: number; limit: number; percentage: number }>

type Props = {
  account: BillingAccount | null
  usage: UsageSummary
  invoices: BillingInvoice[]
  simplified?: boolean
}

const STATUS_COLORS: Record<string, string> = {
  trialing: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  past_due: 'bg-red-100 text-red-700',
  canceled: 'bg-gray-100 text-gray-700',
  paused: 'bg-yellow-100 text-yellow-700',
  unpaid: 'bg-red-100 text-red-700',
}

const INVOICE_STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  open: 'bg-blue-100 text-blue-700',
  draft: 'bg-gray-100 text-gray-600',
  void: 'bg-gray-100 text-gray-500',
  uncollectible: 'bg-red-100 text-red-700',
}

const USAGE_LABELS: Record<string, { label: string; icon: typeof Truck }> = {
  vehicles: { label: 'Vehicles', icon: Truck },
  drivers: { label: 'Drivers', icon: Users },
  loads: { label: 'Loads (this period)', icon: Package },
  ai_queries: { label: 'AI Queries (this period)', icon: Sparkles },
}

function getBarColor(percentage: number): string {
  if (percentage > 85) return 'bg-red-500'
  if (percentage > 60) return 'bg-yellow-500'
  return 'bg-green-500'
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

export function BillingContent({ account, usage, invoices, simplified = false }: Props) {
  const [portalLoading, setPortalLoading] = useState(false)
  const [, startTransition] = useTransition()

  const plan = (account?.plan ?? 'free') as BillingPlan
  const config = PLAN_CONFIG[plan]
  const status = account?.status ?? 'active'

  async function openPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{config.name} Plan</h3>
              <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'}`}>
                {status.replace('_', ' ')}
              </span>
            </div>

            {status === 'trialing' && account?.trial_ends_at && (
              <p className="text-sm text-blue-600 mb-2">
                Trial ends in {getDaysUntil(account.trial_ends_at)} days
              </p>
            )}

            {status === 'past_due' && (
              <div className="flex items-center gap-2 text-sm text-red-600 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Payment past due.</span>
                <button onClick={openPortal} className="underline font-medium">
                  Update payment method
                </button>
              </div>
            )}

            {account && (
              <p className="text-sm text-gray-500">
                {config.monthlyPrice === 0
                  ? 'Free forever'
                  : config.monthlyPrice === -1
                    ? 'Custom pricing'
                    : account.billing_cycle === 'annual'
                      ? `$${config.annualPrice}/year`
                      : `$${config.monthlyPrice}/month`}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Link
              href="/settings/billing/plans"
              className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary/5 transition-colors"
            >
              Change Plan
            </Link>
            {!simplified && (
              <button
                onClick={openPortal}
                disabled={portalLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {portalLoading ? 'Loading...' : 'Manage Billing'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Usage Meters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(USAGE_LABELS) as (keyof typeof USAGE_LABELS)[]).map((key) => {
            const resource = key as UsageResource
            const entry = usage[resource]
            if (!entry) return null
            const { label, icon: Icon } = USAGE_LABELS[key]
            const isUnlimited = entry.limit === -1

            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {isUnlimited
                      ? `${entry.current.toLocaleString()} used`
                      : `${entry.current.toLocaleString()} of ${entry.limit.toLocaleString()}`}
                  </span>
                </div>
                {!isUnlimited && (
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getBarColor(entry.percentage)}`}
                      style={{ width: `${Math.min(entry.percentage, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Payment Method */}
      {!simplified && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Payment Method</h3>
          {account?.payment_method_last4 ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {account.payment_method_brand
                    ? `${account.payment_method_brand.charAt(0).toUpperCase()}${account.payment_method_brand.slice(1)}`
                    : 'Card'}{' '}
                  ****{account.payment_method_last4}
                </span>
              </div>
              <button
                onClick={openPortal}
                className="text-sm text-primary hover:underline"
              >
                Update
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">No payment method on file</span>
              <button
                onClick={openPortal}
                className="px-3 py-1.5 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary/5 transition-colors"
              >
                Add Payment Method
              </button>
            </div>
          )}
        </div>
      )}

      {/* Invoice History */}
      {!simplified ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Invoice History</h3>
          {invoices.length === 0 ? (
            <p className="text-sm text-gray-500">No invoices yet.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-200">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Amount</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium text-right">PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="py-2.5 text-gray-700">
                          {new Date(inv.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-2.5 text-gray-700">
                          ${(inv.total / 100).toFixed(2)}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                              INVOICE_STATUS_COLORS[inv.status] ?? 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          {inv.pdf_url ? (
                            <a
                              href={inv.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              PDF
                            </a>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={openPortal}
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  View all in Stripe
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        // Simplified invoice link for OO view
        invoices.length > 0 && (
          <Link
            href="/settings/billing"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            View Invoices ({invoices.length})
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )
      )}

      {/* Upgrade prompt for free plan */}
      {plan === 'free' && simplified && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-primary mb-1">Upgrade your plan</h4>
          <p className="text-xs text-gray-600 mb-3">
            Get more vehicles, drivers, AI queries, and premium features.
          </p>
          <Link
            href="/settings/billing/plans"
            className="inline-block px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
          >
            View Plans
          </Link>
        </div>
      )}
    </div>
  )
}
