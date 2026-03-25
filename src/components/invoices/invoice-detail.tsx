'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { StatusBadge } from '@/components/ui/status-badge'
import { markInvoiceSent, markInvoicePaid, markInvoiceVoid } from '@/app/(app)/invoices/status-actions'
import { VALID_INVOICE_TRANSITIONS } from '@/lib/invoice-status'
import type { Invoice, InvoiceStatus } from '@/types/database'
import { Pencil, Download, FileText } from 'lucide-react'

interface InvoiceDetailProps {
  invoice: Invoice & {
    load_number?: string | null
  }
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return '--'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDate(date: string | null): string {
  if (!date) return '--'
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 mt-0.5">{value ?? '--'}</dd>
    </div>
  )
}

export function InvoiceDetail({ invoice }: InvoiceDetailProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0])
  const [paidAmount, setPaidAmount] = useState(String(invoice.total))
  const [paymentMethod, setPaymentMethod] = useState('check')

  const validTransitions = VALID_INVOICE_TRANSITIONS[invoice.status as InvoiceStatus] ?? []

  function handleMarkSent() {
    startTransition(async () => {
      setError(null)
      const result = await markInvoiceSent(invoice.id)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  function handleMarkPaid() {
    startTransition(async () => {
      setError(null)
      const result = await markInvoicePaid(
        invoice.id,
        paidDate,
        Number(paidAmount),
        paymentMethod
      )
      if (result.error) {
        setError(result.error)
      } else {
        setShowPaymentForm(false)
        router.refresh()
      }
    })
  }

  function handleMarkVoid() {
    startTransition(async () => {
      setError(null)
      const result = await markInvoiceVoid(invoice.id)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {invoice.invoice_number}
          </h1>
          {invoice.load_number && (
            <p className="text-sm text-gray-500 mt-1">
              Load:{' '}
              <Link href={`/loads/${invoice.load_id}`} className="text-primary hover:underline font-mono">
                {invoice.load_number}
              </Link>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={invoice.status} variant="invoice" />
          <Link
            href={`/invoices/${invoice.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Link>
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            PDF
          </a>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Status Actions */}
      {validTransitions.length > 0 && (
        <div className="flex items-center gap-3">
          {validTransitions.includes('sent') && (
            <button
              type="button"
              onClick={handleMarkSent}
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Updating...' : 'Mark Sent'}
            </button>
          )}
          {validTransitions.includes('paid') && !showPaymentForm && (
            <button
              type="button"
              onClick={() => setShowPaymentForm(true)}
              disabled={isPending}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              Mark Paid
            </button>
          )}
          {validTransitions.includes('void') && (
            <button
              type="button"
              onClick={handleMarkVoid}
              disabled={isPending}
              className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Updating...' : 'Void'}
            </button>
          )}
        </div>
      )}

      {/* Inline Payment Form */}
      {showPaymentForm && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-semibold text-green-900">Payment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="paid_date" className="block text-xs font-medium text-gray-700 mb-1">
                Payment Date
              </label>
              <input
                type="date"
                id="paid_date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="paid_amount" className="block text-xs font-medium text-gray-700 mb-1">
                Amount Paid
              </label>
              <input
                type="number"
                id="paid_amount"
                step="0.01"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="payment_method" className="block text-xs font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                id="payment_method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="check">Check</option>
                <option value="ach">ACH</option>
                <option value="wire">Wire Transfer</option>
                <option value="credit_card">Credit Card</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleMarkPaid}
              disabled={isPending}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Processing...' : 'Confirm Payment'}
            </button>
            <button
              type="button"
              onClick={() => setShowPaymentForm(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bill-To Info */}
      <Section title="Bill To">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Company" value={invoice.bill_to_company} />
          <Field label="Email" value={invoice.bill_to_email} />
          <Field label="Address" value={invoice.bill_to_address} />
        </div>
      </Section>

      {/* Line Items */}
      <Section title="Amounts">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Rate Amount</span>
            <span className="font-medium">{formatCurrency(invoice.amount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Fuel Surcharge</span>
            <span className="font-medium">{formatCurrency(invoice.fuel_surcharge)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Accessorials</span>
            <span className="font-medium">{formatCurrency(invoice.accessorials)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="text-lg font-bold text-gray-900">{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </Section>

      {/* Dates */}
      <Section title="Dates">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Issued" value={formatDate(invoice.issued_date)} />
          <Field label="Due" value={formatDate(invoice.due_date)} />
          <Field
            label="Paid"
            value={
              invoice.paid_date ? (
                <span>
                  {formatDate(invoice.paid_date)}
                  {invoice.paid_amount != null && (
                    <span className="text-gray-500 ml-2">({formatCurrency(invoice.paid_amount)})</span>
                  )}
                  {invoice.payment_method && (
                    <span className="text-gray-500 ml-2">via {invoice.payment_method}</span>
                  )}
                </span>
              ) : (
                '--'
              )
            }
          />
        </div>
      </Section>

      {/* Notes */}
      {invoice.notes && (
        <Section title="Notes">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
        </Section>
      )}
    </div>
  )
}
