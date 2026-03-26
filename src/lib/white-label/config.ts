// White-label configuration constants and helpers

export const DEFAULT_BRAND = {
  brand_name: 'Manifest',
  logo_url: '/logo.svg',
  primary_color: '#EC008C',
  secondary_color: '#1e3a5f',
} as const

export const CSS_VAR_MAP: Record<string, string> = {
  primary_color: '--brand-primary',
  secondary_color: '--brand-secondary',
}

const ENTERPRISE_PLANS = ['enterprise']

export function isEnterprisePlan(plan: string): boolean {
  return ENTERPRISE_PLANS.includes(plan)
}
