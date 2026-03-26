'use client'

import { useState, useTransition } from 'react'
import { PLAN_CONFIG, type PlanConfig } from '@/lib/billing/plans'
import { savePlanSelection } from '@/lib/onboarding/actions'
import type { BillingPlan } from '@/types/database'

const PLAN_ORDER: BillingPlan[] = ['free', 'starter', 'professional', 'enterprise']

function getRecommendedPlan(fleetSize: string): BillingPlan {
  switch (fleetSize) {
    case '1-5': return 'starter'
    case '6-20': return 'professional'
    case '21-50': return 'professional'
    case '51+': return 'enterprise'
    default: return 'starter'
  }
}

interface PlanSelectionStepProps {
  fleetSize: string
  onComplete: () => void
  onBack: () => void
}

export function PlanSelectionStep({ fleetSize, onComplete, onBack }: PlanSelectionStepProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const recommended = getRecommendedPlan(fleetSize)

  const handleSelectPlan = (plan: BillingPlan) => {
    startTransition(async () => {
      const result = await savePlanSelection({ plan })
      if (result?.error) {
        setError(result.error)
        return
      }
      onComplete()
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Choose Your Plan</h2>
        <p className="text-sm text-gray-500 mt-1">
          Start with a 14-day free trial of Professional. Downgrade anytime.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLAN_ORDER.map(planKey => {
          const config: PlanConfig = PLAN_CONFIG[planKey]
          const isRecommended = planKey === recommended
          const isEnterprise = planKey === 'enterprise'

          return (
            <div
              key={planKey}
              className={`relative border rounded-lg p-4 transition-colors ${
                isRecommended
                  ? 'border-blue-500 ring-2 ring-blue-100'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {isRecommended && (
                <span className="absolute -top-2.5 left-4 bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              )}

              <h3 className="text-base font-semibold text-gray-900 mt-1">{config.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{config.description}</p>

              <div className="mt-3">
                {config.monthlyPrice === 0 ? (
                  <span className="text-2xl font-bold text-gray-900">Free</span>
                ) : config.monthlyPrice === -1 ? (
                  <span className="text-lg font-bold text-gray-900">Contact Us</span>
                ) : (
                  <div>
                    <span className="text-2xl font-bold text-gray-900">${config.monthlyPrice}</span>
                    <span className="text-sm text-gray-500">/mo</span>
                  </div>
                )}
              </div>

              <ul className="mt-3 space-y-1.5">
                {config.features.slice(0, 5).map(feature => (
                  <li key={feature} className="flex items-start gap-1.5 text-xs text-gray-600">
                    <svg className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
                {config.features.length > 5 && (
                  <li className="text-xs text-gray-400">
                    +{config.features.length - 5} more features
                  </li>
                )}
              </ul>

              <button
                type="button"
                onClick={() => handleSelectPlan(planKey)}
                disabled={isPending || isEnterprise}
                className={`mt-4 w-full py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors ${
                  isRecommended
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : planKey === 'free'
                      ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {isEnterprise
                  ? 'Contact Sales'
                  : planKey === 'free'
                    ? 'Start with Free'
                    : isRecommended
                      ? 'Start Free Trial'
                      : `Choose ${config.name}`}
              </button>
            </div>
          )
        })}
      </div>

      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
        >
          Back
        </button>
        <p className="text-xs text-gray-400">
          All paid plans include a 14-day free trial
        </p>
      </div>
    </div>
  )
}
