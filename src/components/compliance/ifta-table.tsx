'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { calculateIFTA, exportIFTAToCSV, type IFTAInput, type IFTAResult } from '@/lib/compliance/ifta-helpers'
import { IFTAEntryForm } from './ifta-entry-form'
import type { IFTARecord, Vehicle } from '@/types/database'

interface IFTATableProps {
  records: IFTARecord[]
  totalFleetMiles: number
  totalFleetGallons: number
  vehicles: Vehicle[]
  currentQuarter: string
}

function formatNumber(n: number, decimals = 2): string {
  return n.toFixed(decimals)
}

function formatCurrency(n: number): string {
  return n < 0 ? `-$${Math.abs(n).toFixed(2)}` : `$${n.toFixed(2)}`
}

export function IFTATable({ records, totalFleetMiles, totalFleetGallons, vehicles, currentQuarter }: IFTATableProps) {
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()

  // Aggregate records by jurisdiction for IFTA calculation
  const iftaInputs: IFTAInput[] = useMemo(() => {
    const jurisdictionMap = new Map<string, { miles: number; gallons: number; taxRate: number; taxPaid: number }>()
    for (const r of records) {
      const existing = jurisdictionMap.get(r.jurisdiction)
      if (existing) {
        existing.miles += r.miles_traveled
        existing.gallons += r.gallons_purchased
        // Use latest tax rate
        if (r.tax_rate !== null) existing.taxRate = r.tax_rate
        if (r.tax_paid !== null) existing.taxPaid += r.tax_paid
      } else {
        jurisdictionMap.set(r.jurisdiction, {
          miles: r.miles_traveled,
          gallons: r.gallons_purchased,
          taxRate: r.tax_rate ?? 0,
          taxPaid: r.tax_paid ?? 0,
        })
      }
    }

    return Array.from(jurisdictionMap.entries()).map(([jurisdiction, data]) => ({
      jurisdiction,
      miles_traveled: data.miles,
      gallons_purchased: data.gallons,
      tax_rate: data.taxRate,
      tax_paid: data.taxPaid,
    }))
  }, [records])

  const calculated: IFTAResult[] = useMemo(
    () => calculateIFTA(iftaInputs, totalFleetMiles, totalFleetGallons),
    [iftaInputs, totalFleetMiles, totalFleetGallons]
  )

  // Summary totals
  const totals = useMemo(() => {
    return calculated.reduce(
      (acc, r) => ({
        miles: acc.miles + r.miles_traveled,
        gallonsPurchased: acc.gallonsPurchased + r.gallons_purchased,
        gallonsConsumed: acc.gallonsConsumed + r.gallons_consumed,
        netTaxable: acc.netTaxable + r.net_taxable_gallons,
        taxOwed: acc.taxOwed + r.tax_owed,
        taxPaid: acc.taxPaid + r.tax_paid,
        netTax: acc.netTax + r.net_tax,
      }),
      { miles: 0, gallonsPurchased: 0, gallonsConsumed: 0, netTaxable: 0, taxOwed: 0, taxPaid: 0, netTax: 0 }
    )
  }, [calculated])

  function handleExport() {
    const csv = exportIFTAToCSV(calculated)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `IFTA-${currentQuarter}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Actions */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover"
        >
          {showForm ? 'Hide Form' : 'Add Entry'}
        </button>
        {calculated.length > 0 && (
          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Export CSV
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-6">
          <IFTAEntryForm
            vehicles={vehicles}
            currentQuarter={currentQuarter}
            onSuccess={() => {
              setShowForm(false)
              router.refresh()
            }}
          />
        </div>
      )}

      {calculated.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No IFTA data for {currentQuarter}</p>
          <p className="mt-1 text-sm">Add entries to begin tracking fuel tax by jurisdiction.</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jurisdiction</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Miles</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gal. Purchased</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gal. Consumed</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Taxable</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tax Rate</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tax Owed</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tax Paid</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Tax</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {calculated.map((r) => (
                <tr key={r.jurisdiction} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.jurisdiction}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatNumber(r.miles_traveled, 0)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatNumber(r.gallons_purchased, 3)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatNumber(r.gallons_consumed, 3)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatNumber(r.net_taxable_gallons, 3)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(r.tax_rate)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(r.tax_owed)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(r.tax_paid)}</td>
                  <td className={`px-4 py-3 text-sm font-medium text-right ${r.net_tax > 0 ? 'text-red-600' : r.net_tax < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                    {formatCurrency(r.net_tax)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr className="font-semibold">
                <td className="px-4 py-3 text-sm text-gray-900">Totals</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatNumber(totals.miles, 0)}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatNumber(totals.gallonsPurchased, 3)}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatNumber(totals.gallonsConsumed, 3)}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatNumber(totals.netTaxable, 3)}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">-</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(totals.taxOwed)}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(totals.taxPaid)}</td>
                <td className={`px-4 py-3 text-sm font-semibold text-right ${totals.netTax > 0 ? 'text-red-600' : totals.netTax < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {formatCurrency(totals.netTax)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
