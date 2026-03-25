'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { INVOICE_STATUSES, getInvoiceStatusLabel } from '@/lib/invoice-status'
import { X } from 'lucide-react'

export function InvoiceFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') ?? '')
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') ?? '')
  const [customer, setCustomer] = useState(searchParams.get('customer') ?? '')

  const updateFilters = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      router.push(`/invoices?${params.toString()}`)
    },
    [router, searchParams]
  )

  // Sync local state on external searchParams change
  useEffect(() => {
    setStatus(searchParams.get('status') ?? '')
    setDateFrom(searchParams.get('date_from') ?? '')
    setDateTo(searchParams.get('date_to') ?? '')
    setCustomer(searchParams.get('customer') ?? '')
  }, [searchParams])

  const hasFilters = status || dateFrom || dateTo || customer

  function clearFilters() {
    setStatus('')
    setDateFrom('')
    setDateTo('')
    setCustomer('')
    router.push('/invoices')
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Status */}
      <div className="space-y-1">
        <label htmlFor="filter-status" className="text-xs font-medium text-gray-500">
          Status
        </label>
        <select
          id="filter-status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            updateFilters({ status: e.target.value })
          }}
          className="block w-36 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          {INVOICE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {getInvoiceStatusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      {/* Date From */}
      <div className="space-y-1">
        <label htmlFor="filter-date-from" className="text-xs font-medium text-gray-500">
          Issued From
        </label>
        <input
          type="date"
          id="filter-date-from"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value)
            updateFilters({ date_from: e.target.value })
          }}
          className="block w-36 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Date To */}
      <div className="space-y-1">
        <label htmlFor="filter-date-to" className="text-xs font-medium text-gray-500">
          Issued To
        </label>
        <input
          type="date"
          id="filter-date-to"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value)
            updateFilters({ date_to: e.target.value })
          }}
          className="block w-36 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Broker/Customer */}
      <div className="space-y-1">
        <label htmlFor="filter-customer" className="text-xs font-medium text-gray-500">
          Broker/Customer
        </label>
        <input
          type="text"
          id="filter-customer"
          placeholder="Search..."
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          onBlur={() => updateFilters({ customer })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') updateFilters({ customer })
          }}
          className="block w-40 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </button>
      )}
    </div>
  )
}
