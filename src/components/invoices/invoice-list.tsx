import Link from 'next/link'
import { StatusBadge } from '@/components/ui/status-badge'
import type { Invoice } from '@/types/database'

interface InvoiceListProps {
  invoices: Invoice[]
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

export function InvoiceList({ invoices }: InvoiceListProps) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No invoices found</p>
        <p className="text-sm mt-1">Try adjusting your filters or create a new invoice.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="pb-3 pr-4 font-medium text-gray-500">Invoice #</th>
            <th className="pb-3 pr-4 font-medium text-gray-500">Bill To</th>
            <th className="pb-3 pr-4 font-medium text-gray-500 text-right">Total</th>
            <th className="pb-3 pr-4 font-medium text-gray-500">Status</th>
            <th className="pb-3 pr-4 font-medium text-gray-500">Issued</th>
            <th className="pb-3 font-medium text-gray-500">Due</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr
              key={invoice.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="py-3 pr-4">
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {invoice.invoice_number}
                </Link>
              </td>
              <td className="py-3 pr-4 text-sm text-gray-900">
                {invoice.bill_to_company}
              </td>
              <td className="py-3 pr-4 text-sm text-right font-medium">
                {formatCurrency(invoice.total)}
              </td>
              <td className="py-3 pr-4">
                <StatusBadge status={invoice.status} variant="invoice" />
              </td>
              <td className="py-3 pr-4 text-sm text-gray-600">
                {formatDate(invoice.issued_date)}
              </td>
              <td className="py-3 text-sm text-gray-600">
                {formatDate(invoice.due_date)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
