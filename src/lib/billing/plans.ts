import type { BillingPlan } from '@/types/database'

export type PlanConfig = {
  name: string
  description: string
  monthlyPrice: number  // 0 for free, -1 for "contact us"
  annualPrice: number   // 0 for free, -1 for "contact us"
  limits: {
    vehicles: number    // -1 = unlimited
    drivers: number
    loadsPerMonth: number
    users: number
    aiQueriesPerMonth: number
    voiceMinutesPerMonth: number
  }
  features: string[]    // Human-readable feature list for comparison page
  modules: {
    compliance: boolean
    ifta: boolean
    crm: boolean
    ai: boolean
    api: boolean
    whiteLabel: boolean
    prioritySupport: boolean
  }
  stripePriceId?: {
    monthly: string
    annual: string
  }
}

export const PLANS: BillingPlan[] = ['free', 'starter', 'professional', 'enterprise']

export const PLAN_CONFIG: Record<BillingPlan, PlanConfig> = {
  free: {
    name: 'Free',
    description: 'Get started with basic fleet management',
    monthlyPrice: 0,
    annualPrice: 0,
    limits: {
      vehicles: 3,
      drivers: 3,
      loadsPerMonth: 50,
      users: 2,
      aiQueriesPerMonth: 0,
      voiceMinutesPerMonth: 0,
    },
    features: [
      'Up to 3 vehicles',
      'Up to 3 drivers',
      '50 loads per month',
      '2 team members',
      'Basic dispatch board',
      'Load tracking',
      'Invoicing',
    ],
    modules: {
      compliance: false,
      ifta: false,
      crm: false,
      ai: false,
      api: false,
      whiteLabel: false,
      prioritySupport: false,
    },
  },
  starter: {
    name: 'Starter',
    description: 'For growing carriers ready to scale operations',
    monthlyPrice: 29,
    annualPrice: 290,
    limits: {
      vehicles: 10,
      drivers: 15,
      loadsPerMonth: 200,
      users: 5,
      aiQueriesPerMonth: 100,
      voiceMinutesPerMonth: 30,
    },
    features: [
      'Up to 10 vehicles',
      'Up to 15 drivers',
      '200 loads per month',
      '5 team members',
      'Compliance module',
      'Marie AI assistant (100 queries/mo)',
      '30 voice minutes per month',
      'Driver mobile app',
    ],
    modules: {
      compliance: true,
      ifta: false,
      crm: false,
      ai: true,
      api: false,
      whiteLabel: false,
      prioritySupport: false,
    },
    stripePriceId: {
      monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || '',
      annual: process.env.STRIPE_PRICE_STARTER_ANNUAL || '',
    },
  },
  professional: {
    name: 'Professional',
    description: 'Full-featured platform for established carriers',
    monthlyPrice: 79,
    annualPrice: 790,
    limits: {
      vehicles: 50,
      drivers: 75,
      loadsPerMonth: 1000,
      users: 15,
      aiQueriesPerMonth: 500,
      voiceMinutesPerMonth: 120,
    },
    features: [
      'Up to 50 vehicles',
      'Up to 75 drivers',
      '1,000 loads per month',
      '15 team members',
      'All modules included',
      'Marie AI assistant (500 queries/mo)',
      '120 voice minutes per month',
      'IFTA reporting',
      'CRM & customer management',
      'API access',
      'Advanced analytics',
    ],
    modules: {
      compliance: true,
      ifta: true,
      crm: true,
      ai: true,
      api: true,
      whiteLabel: false,
      prioritySupport: false,
    },
    stripePriceId: {
      monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || '',
      annual: process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL || '',
    },
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Custom solutions for large fleet operations',
    monthlyPrice: -1,
    annualPrice: -1,
    limits: {
      vehicles: -1,
      drivers: -1,
      loadsPerMonth: -1,
      users: -1,
      aiQueriesPerMonth: -1,
      voiceMinutesPerMonth: -1,
    },
    features: [
      'Unlimited vehicles',
      'Unlimited drivers',
      'Unlimited loads',
      'Unlimited team members',
      'All modules included',
      'Unlimited AI queries',
      'Unlimited voice minutes',
      'White-label branding',
      'Priority support',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
    ],
    modules: {
      compliance: true,
      ifta: true,
      crm: true,
      ai: true,
      api: true,
      whiteLabel: true,
      prioritySupport: true,
    },
    stripePriceId: {
      monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
      annual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL || '',
    },
  },
}

/**
 * Get the limits for a specific billing plan
 */
export function getPlanLimits(plan: BillingPlan): PlanConfig['limits'] {
  return PLAN_CONFIG[plan].limits
}

/**
 * Check if a specific module/feature is enabled for a plan
 */
export function isFeatureEnabled(plan: BillingPlan, feature: keyof PlanConfig['modules']): boolean {
  return PLAN_CONFIG[plan].modules[feature]
}

/**
 * Format a limit value for display (-1 becomes "Unlimited")
 */
export function formatLimit(value: number): string {
  return value === -1 ? 'Unlimited' : value.toLocaleString()
}
