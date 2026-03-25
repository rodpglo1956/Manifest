import { describe, it, expect } from 'vitest'
import {
  INVOICE_STATUSES,
  VALID_INVOICE_TRANSITIONS,
  canTransitionInvoice,
  getInvoiceStatusLabel,
} from '@/lib/invoice-status'

describe('INVOICE_STATUSES', () => {
  it('contains exactly the 5 invoice statuses', () => {
    expect(INVOICE_STATUSES).toEqual(['draft', 'sent', 'paid', 'overdue', 'void'])
  })
})

describe('canTransitionInvoice', () => {
  it('allows draft -> sent', () => {
    expect(canTransitionInvoice('draft', 'sent')).toBe(true)
  })

  it('disallows draft -> paid', () => {
    expect(canTransitionInvoice('draft', 'paid')).toBe(false)
  })

  it('allows sent -> paid', () => {
    expect(canTransitionInvoice('sent', 'paid')).toBe(true)
  })

  it('allows sent -> void', () => {
    expect(canTransitionInvoice('sent', 'void')).toBe(true)
  })

  it('allows overdue -> paid', () => {
    expect(canTransitionInvoice('overdue', 'paid')).toBe(true)
  })

  it('allows overdue -> void', () => {
    expect(canTransitionInvoice('overdue', 'void')).toBe(true)
  })

  it('disallows paid -> any', () => {
    expect(canTransitionInvoice('paid', 'draft')).toBe(false)
    expect(canTransitionInvoice('paid', 'sent')).toBe(false)
    expect(canTransitionInvoice('paid', 'void')).toBe(false)
    expect(canTransitionInvoice('paid', 'overdue')).toBe(false)
  })

  it('disallows void -> any', () => {
    expect(canTransitionInvoice('void', 'draft')).toBe(false)
    expect(canTransitionInvoice('void', 'sent')).toBe(false)
    expect(canTransitionInvoice('void', 'paid')).toBe(false)
    expect(canTransitionInvoice('void', 'overdue')).toBe(false)
  })

  it('allows draft -> void', () => {
    expect(canTransitionInvoice('draft', 'void')).toBe(true)
  })
})

describe('VALID_INVOICE_TRANSITIONS', () => {
  it('draft can go to sent or void', () => {
    expect(VALID_INVOICE_TRANSITIONS.draft).toEqual(['sent', 'void'])
  })

  it('sent can go to paid or void', () => {
    expect(VALID_INVOICE_TRANSITIONS.sent).toEqual(['paid', 'void'])
  })

  it('overdue can go to paid or void', () => {
    expect(VALID_INVOICE_TRANSITIONS.overdue).toEqual(['paid', 'void'])
  })

  it('paid has no transitions', () => {
    expect(VALID_INVOICE_TRANSITIONS.paid).toEqual([])
  })

  it('void has no transitions', () => {
    expect(VALID_INVOICE_TRANSITIONS.void).toEqual([])
  })
})

describe('getInvoiceStatusLabel', () => {
  it('returns human-readable labels', () => {
    expect(getInvoiceStatusLabel('draft')).toBe('Draft')
    expect(getInvoiceStatusLabel('sent')).toBe('Sent')
    expect(getInvoiceStatusLabel('paid')).toBe('Paid')
    expect(getInvoiceStatusLabel('overdue')).toBe('Overdue')
    expect(getInvoiceStatusLabel('void')).toBe('Void')
  })
})
