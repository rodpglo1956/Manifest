'use client'

import { useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { PLANS, PLAN_CONFIG } from '@/lib/billing/plans'
import { formatLimit } from '@/lib/billing/plans'
import type { BillingPlan, BillingCycle } from '@/types/database'

type Props = {
  currentPlan: BillingPlan
}

const MODULE_LABELS: { key: keyof (typeof PLAN_CONFIG)['free']['modules']; label: string }[] = [
  { key: 'compliance', label: 'Compliance' },
  { key: 'ifta', label: 'IFTA Reporting' },
  { key: 'crm', label: 'CRM' },
  { key: 'ai', label: 'AI Assistant' },
  { key: 'api', label: 'API Access' },
  { key: 'whiteLabel', label: 'White Label' },
  { key: 'prioritySupport', label: 'Priority Support' },
]

function getPlanIndex(plan: BillingPlan): number {
  return PLANS.indexOf(plan)
}

export function PlanComparison({ currentPlan }: Props) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [loadingPlan, setLoadingPlan] = useState<BillingPlan | null>(null)

  async function handleSelectPlan(plan: BillingPlan) {
    if (plan === currentPlan || plan === 'enterprise') return

    setLoadingPlan(plan)
    try {
      const res = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billingCycle }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setLoadingPlan(null)
    }
  }

  function getCtaLabel(plan: BillingPlan): string {
    if (plan === currentPlan) return 'Current Plan'
    if (plan === 'enterprise') return 'Contact Sales'
    const currentIdx = getPlanIndex(currentPlan)
    const targetIdx = getPlanIndex(plan)
    return targetIdx > currentIdx ? 'Upgrade' : 'Downgrade'
  }

  function getCtaStyle(plan: BillingPlan): string {
    if (plan === currentPlan) {
      return 'border border-gray-300 text-gray-500 cursor-default'
    }
    if (plan === 'enterprise') {
      return 'border border-primary text-primary hover:bg-primary/5'
    }
    const currentIdx = getPlanIndex(currentPlan)
    const targetIdx = getPlanIndex(plan)
    if (targetIdx > currentIdx) {
      return 'bg-primary text-white hover:bg-primary/90'
    }
    return 'border border-gray-300 text-gray-700 hover:bg-gray-50'
  }

  function formatPrice(plan: BillingPlan): string {
    const config = PLAN_CONFIG[plan]
    if (config.monthlyPrice === 0) return 'Free forever'
    if (config.monthlyPrice === -1) return 'Custom pricing'
    if (billingCycle === 'annual') {
      return `$${config.annualPrice}/yr`
    }
    return `$${config.monthlyPrice}/mo`
  }

  return (
    <div className="space-y-6">
      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span
          className={`text-sm ${billingCycle === 'monthly' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}
        >
          Monthly
        </span>
        <button
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            billingCycle === 'annual' ? 'bg-primary' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span
          className={`text-sm ${billingCycle === 'annual' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}
        >
          Annual{' '}
          <span className="text-xs text-green-600 font-medium">(save 17%)</span>
        </span>
      </div>

      {/* Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const config = PLAN_CONFIG[plan]
          const isCurrent = plan === currentPlan
          const isProfessional = plan === 'professional'

          return (
            <div
              key={plan}
              className={`relative rounded-lg border p-5 flex flex-col ${
                isProfessional
                  ? 'border-primary shadow-md ring-1 ring-primary/20'
                  : 'border-gray-200 shadow-sm'
              }`}
            >
              {/* Badges */}
              {isProfessional && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-white text-xs font-medium rounded-full">
                  Most Popular
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 right-3 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Current
                </span>
              )}

              {/* Header */}
              <h3 className="text-lg font-semibold text-gray-900 mt-1">{config.name}</h3>
              <p className="text-sm text-gray-500 mt-1 mb-3">{config.description}</p>
              <p className="text-2xl font-bold text-gray-900 mb-4">{formatPrice(plan)}</p>

              {/* Limits */}
              <div className="space-y-1.5 mb-4 text-sm text-gray-600">
                <p>{formatLimit(config.limits.vehicles)} vehicles</p>
                <p>{formatLimit(config.limits.drivers)} drivers</p>
                <p>{formatLimit(config.limits.loadsPerMonth)} loads/mo</p>
                <p>{formatLimit(config.limits.aiQueriesPerMonth)} AI queries/mo</p>
              </div>

              {/* Modules */}
              <div className="flex-1 space-y-1.5 mb-5">
                {MODULE_LABELS.map(({ key, label }) => {
                  const enabled = config.modules[key]
                  return (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      {enabled ? (
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-gray-300 shrink-0" />
                      )}
                      <span className={enabled ? 'text-gray-700' : 'text-gray-400'}>{label}</span>
                    </div>
                  )
                })}
              </div>

              {/* CTA */}
              {plan === 'enterprise' ? (
                <a
                  href="mailto:sales@glomatrix.com"
                  className={`block w-full text-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${getCtaStyle(plan)}`}
                >
                  Contact Sales
                </a>
              ) : (
                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrent || loadingPlan !== null}
                  className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${getCtaStyle(plan)}`}
                >
                  {loadingPlan === plan ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    getCtaLabel(plan)
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
