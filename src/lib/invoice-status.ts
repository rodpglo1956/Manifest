import type { InvoiceStatus } from '@/types/database'

// Re-export for convenience
export type { InvoiceStatus } from '@/types/database'

// All 5 invoice statuses in lifecycle order
export const INVOICE_STATUSES: InvoiceStatus[] = [
  'draft',
  'sent',
  'paid',
  'overdue',
  'void',
]

// Valid status transitions
// Note: 'overdue' is set by pg_cron (not user action), but users can transition FROM overdue
export const VALID_INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['sent', 'void'],
  sent: ['paid', 'void'],
  overdue: ['paid', 'void'],
  paid: [],
  void: [],
}

/**
 * Check if an invoice status transition is valid
 */
export function canTransitionInvoice(from: InvoiceStatus, to: InvoiceStatus): boolean {
  return VALID_INVOICE_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Get human-readable label for an invoice status
 */
export function getInvoiceStatusLabel(status: InvoiceStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft'
    case 'sent':
      return 'Sent'
    case 'paid':
      return 'Paid'
    case 'overdue':
      return 'Overdue'
    case 'void':
      return 'Void'
    default:
      return status
  }
}
