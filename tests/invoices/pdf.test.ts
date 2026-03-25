import { describe, it, expect } from 'vitest'
import { InvoicePDF, formatCurrency } from '@/components/invoices/invoice-pdf'

describe('InvoicePDF', () => {
  it('is a function/component', () => {
    expect(typeof InvoicePDF).toBe('function')
  })

  it('accepts invoice props without throwing', () => {
    const mockInvoice = {
      id: 'inv-1',
      org_id: 'org-1',
      load_id: 'load-1',
      invoice_number: 'INV-202603-0001',
      bill_to_company: 'Test Broker LLC',
      bill_to_email: 'broker@test.com',
      bill_to_address: '123 Main St, Dallas, TX 75201',
      amount: 2500,
      fuel_surcharge: 150,
      accessorials: 75,
      total: 2725,
      status: 'draft' as const,
      issued_date: '2026-03-01',
      due_date: '2026-03-31',
      paid_date: null,
      paid_amount: null,
      payment_method: null,
      notes: 'Test notes',
      pdf_url: null,
      created_at: '2026-03-01T00:00:00Z',
      updated_at: '2026-03-01T00:00:00Z',
    }

    // Component should be callable without throwing
    expect(() => InvoicePDF({ invoice: mockInvoice })).not.toThrow()
  })
})

describe('formatCurrency', () => {
  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('formats whole numbers with 2 decimals', () => {
    expect(formatCurrency(100)).toBe('$100.00')
  })

  it('formats decimal values', () => {
    expect(formatCurrency(100.5)).toBe('$100.50')
  })

  it('formats large numbers with commas', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })
})
