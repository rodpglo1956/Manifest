import { describe, it, expect } from 'vitest'
import { calculateIFTA, exportIFTAToCSV } from '@/lib/compliance/ifta-helpers'

describe('calculateIFTA', () => {
  it('computes consumed gallons from fleet MPG and jurisdiction miles', () => {
    const records = [
      {
        jurisdiction: 'TX',
        miles_traveled: 1000,
        gallons_purchased: 120,
        tax_rate: 0.20,
        tax_paid: 24,
      },
      {
        jurisdiction: 'OK',
        miles_traveled: 500,
        gallons_purchased: 40,
        tax_rate: 0.19,
        tax_paid: 10,
      },
    ]

    // Total fleet: 10000 miles, 2000 gallons => MPG = 5
    const result = calculateIFTA(records, 10000, 2000)

    // TX: consumed = 1000/5 = 200, netTaxable = 200-120 = 80, taxOwed = 80*0.20 = 16, netTax = 16-24 = -8
    expect(result[0].gallons_consumed).toBe(200)
    expect(result[0].net_taxable_gallons).toBe(80)
    expect(result[0].tax_owed).toBe(16)
    expect(result[0].net_tax).toBe(-8)

    // OK: consumed = 500/5 = 100, netTaxable = 100-40 = 60, taxOwed = 60*0.19 = 11.40, netTax = 11.40-10 = 1.40
    expect(result[1].gallons_consumed).toBe(100)
    expect(result[1].net_taxable_gallons).toBe(60)
    expect(result[1].tax_owed).toBe(11.40)
    expect(result[1].net_tax).toBe(1.40)
  })

  it('handles zero gallons edge case', () => {
    const records = [
      { jurisdiction: 'CA', miles_traveled: 100, gallons_purchased: 0, tax_rate: 0.20, tax_paid: 0 },
    ]
    const result = calculateIFTA(records, 0, 0)
    expect(result[0].gallons_consumed).toBe(0)
    expect(result[0].net_tax).toBe(0)
  })

  it('handles multiple jurisdictions', () => {
    const records = [
      { jurisdiction: 'TX', miles_traveled: 500, gallons_purchased: 50, tax_rate: 0.20, tax_paid: 10 },
      { jurisdiction: 'OK', miles_traveled: 300, gallons_purchased: 30, tax_rate: 0.19, tax_paid: 5 },
      { jurisdiction: 'AR', miles_traveled: 200, gallons_purchased: 20, tax_rate: 0.245, tax_paid: 5 },
    ]
    const result = calculateIFTA(records, 5000, 1000)
    expect(result).toHaveLength(3)
    expect(result.every((r) => typeof r.gallons_consumed === 'number')).toBe(true)
  })
})

describe('exportIFTAToCSV', () => {
  it('produces valid CSV with correct headers', () => {
    const records = [
      {
        jurisdiction: 'TX',
        miles_traveled: 1000,
        gallons_purchased: 120,
        gallons_consumed: 200,
        net_taxable_gallons: 80,
        tax_rate: 0.20,
        tax_owed: 16,
        tax_paid: 24,
        net_tax: -8,
      },
    ]
    const csv = exportIFTAToCSV(records)
    const lines = csv.split('\n')
    expect(lines[0]).toBe('Jurisdiction,Miles,Gallons Purchased,Gallons Consumed,Net Taxable Gallons,Tax Rate,Tax Owed,Tax Paid,Net Tax')
    expect(lines[1]).toBe('TX,1000,120,200,80,0.20,16.00,24.00,-8.00')
  })

  it('handles empty input', () => {
    const csv = exportIFTAToCSV([])
    const lines = csv.split('\n')
    expect(lines).toHaveLength(1) // headers only
  })
})
