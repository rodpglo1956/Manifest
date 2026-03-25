/**
 * IFTA (International Fuel Tax Agreement) calculation and CSV export helpers.
 * Uses fleet MPG formula: total fleet miles / total fleet gallons.
 */

export interface IFTAInput {
  jurisdiction: string
  miles_traveled: number
  gallons_purchased: number
  tax_rate: number
  tax_paid: number
}

export interface IFTAResult {
  jurisdiction: string
  miles_traveled: number
  gallons_purchased: number
  gallons_consumed: number
  net_taxable_gallons: number
  tax_rate: number
  tax_owed: number
  tax_paid: number
  net_tax: number
}

/**
 * Calculate IFTA for each jurisdiction record.
 *
 * Fleet MPG = totalFleetMiles / totalFleetGallons
 * Per jurisdiction:
 *   consumed = miles / MPG
 *   netTaxable = consumed - purchased
 *   taxOwed = netTaxable * rate
 *   netTax = taxOwed - taxPaid
 *
 * Gallons rounded to 3 decimal places, dollars to 2.
 */
export function calculateIFTA(
  records: IFTAInput[],
  totalFleetMiles: number,
  totalFleetGallons: number
): IFTAResult[] {
  const mpg = totalFleetGallons > 0 ? totalFleetMiles / totalFleetGallons : 0

  return records.map((r) => {
    const gallonsConsumed = mpg > 0 ? round(r.miles_traveled / mpg, 3) : 0
    const netTaxableGallons = round(gallonsConsumed - r.gallons_purchased, 3)
    const taxOwed = round(netTaxableGallons * r.tax_rate, 2)
    const netTax = round(taxOwed - r.tax_paid, 2)

    return {
      jurisdiction: r.jurisdiction,
      miles_traveled: r.miles_traveled,
      gallons_purchased: r.gallons_purchased,
      gallons_consumed: gallonsConsumed,
      net_taxable_gallons: netTaxableGallons,
      tax_rate: r.tax_rate,
      tax_owed: taxOwed,
      tax_paid: r.tax_paid,
      net_tax: netTax,
    }
  })
}

/**
 * Export IFTA results to CSV string.
 */
export function exportIFTAToCSV(records: IFTAResult[]): string {
  const headers = 'Jurisdiction,Miles,Gallons Purchased,Gallons Consumed,Net Taxable Gallons,Tax Rate,Tax Owed,Tax Paid,Net Tax'

  const rows = records.map((r) =>
    [
      r.jurisdiction,
      r.miles_traveled,
      r.gallons_purchased,
      r.gallons_consumed,
      r.net_taxable_gallons,
      r.tax_rate.toFixed(2),
      r.tax_owed.toFixed(2),
      r.tax_paid.toFixed(2),
      r.net_tax.toFixed(2),
    ].join(',')
  )

  return [headers, ...rows].join('\n')
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}
