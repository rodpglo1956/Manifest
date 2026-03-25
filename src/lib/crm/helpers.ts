import type { CrmCompanyType, CrmActivityType } from '@/types/database'

// ============================================================
// CRM Helper Utilities
// Phase 09: CRM & Cross-Module Integration
// ============================================================

const COMPANY_TYPE_LABELS: Record<CrmCompanyType, string> = {
  customer: 'Customer',
  broker: 'Broker',
  vendor: 'Vendor',
  partner: 'Partner',
  prospect: 'Prospect',
}

const ACTIVITY_TYPE_LABELS: Record<CrmActivityType, string> = {
  call: 'Phone Call',
  email: 'Email',
  note: 'Note',
  meeting: 'Meeting',
  rate_negotiation: 'Rate Negotiation',
  load_booked: 'Load Booked',
  issue: 'Issue',
  follow_up: 'Follow Up',
  system: 'System',
}

/** Format company type for display (title case) */
export function formatCompanyType(type: CrmCompanyType): string {
  return COMPANY_TYPE_LABELS[type] ?? type
}

/** Format activity type for display (human-readable) */
export function formatActivityType(type: CrmActivityType): string {
  return ACTIVITY_TYPE_LABELS[type] ?? type
}

/** Get effective agreement status, returning 'expiring_soon' if within 30 days */
export function getAgreementStatus(agreement: { expiry_date: string | null; status: string }): string {
  if (agreement.status !== 'active' || !agreement.expiry_date) {
    return agreement.status
  }
  return isAgreementExpiring(agreement.expiry_date) ? 'expiring_soon' : agreement.status
}

/** Check if agreement expires within threshold days (default 30) */
export function isAgreementExpiring(expiryDate: string | null, daysThreshold = 30): boolean {
  if (!expiryDate) return false
  const expiry = new Date(expiryDate)
  const now = new Date()
  const diffMs = expiry.getTime() - now.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays <= daysThreshold
}

/** Format a number as USD currency */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

/** Format rate per mile as "$X.XX/mi" */
export function formatRatePerMile(rate: number | null): string {
  if (rate === null || rate === undefined) return '--'
  return `$${rate.toFixed(2)}/mi`
}
