import { describe, it, expect } from 'vitest'
import { invoiceSchema } from '@/schemas/invoice'

describe('invoiceSchema', () => {
  const validInput = {
    bill_to_company: 'Acme Corp',
    bill_to_email: 'billing@acme.com',
    amount: '1000',
    fuel_surcharge: '50',
    accessorials: '25',
    total: '1075',
    issued_date: '2026-01-15',
    due_date: '2026-02-15',
    notes: '',
    payment_method: '',
  }

  it('validates a complete valid input', () => {
    const result = invoiceSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('validates with optional email omitted', () => {
    const { bill_to_email, ...input } = validInput
    const result = invoiceSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('validates with empty email string', () => {
    const result = invoiceSchema.safeParse({ ...validInput, bill_to_email: '' })
    expect(result.success).toBe(true)
  })

  it('rejects empty bill_to_company', () => {
    const result = invoiceSchema.safeParse({ ...validInput, bill_to_company: '' })
    expect(result.success).toBe(false)
  })

  it('rejects negative amount', () => {
    const result = invoiceSchema.safeParse({ ...validInput, amount: '-100' })
    expect(result.success).toBe(false)
  })

  it('rejects missing issued_date', () => {
    const { issued_date, ...input } = validInput
    const result = invoiceSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects missing due_date', () => {
    const { due_date, ...input } = validInput
    const result = invoiceSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('coerces string numbers to numeric values', () => {
    const result = invoiceSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(typeof result.data.amount).toBe('number')
      expect(result.data.amount).toBe(1000)
      expect(typeof result.data.fuel_surcharge).toBe('number')
      expect(result.data.fuel_surcharge).toBe(50)
    }
  })

  it('defaults notes and payment_method to empty string', () => {
    const { notes, payment_method, ...input } = validInput
    const result = invoiceSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.notes).toBe('')
      expect(result.data.payment_method).toBe('')
    }
  })

  it('rejects invalid email format', () => {
    const result = invoiceSchema.safeParse({ ...validInput, bill_to_email: 'not-an-email' })
    expect(result.success).toBe(false)
  })
})
