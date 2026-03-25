'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { invoiceSchema, type InvoiceInput } from '@/schemas/invoice'
import type { Invoice } from '@/types/database'

interface InvoiceFormProps {
  initialData?: Invoice
  onSubmit: (data: FormData) => void
  isLoading?: boolean
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function InvoiceForm({ initialData, onSubmit, isLoading }: InvoiceFormProps) {
  const isEditMode = !!initialData

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: initialData
      ? {
          bill_to_company: initialData.bill_to_company,
          bill_to_email: initialData.bill_to_email ?? '',
          bill_to_address: initialData.bill_to_address ?? '',
          amount: initialData.amount,
          fuel_surcharge: initialData.fuel_surcharge,
          accessorials: initialData.accessorials,
          total: initialData.total,
          issued_date: initialData.issued_date ?? '',
          due_date: initialData.due_date ?? '',
          notes: initialData.notes ?? '',
          payment_method: initialData.payment_method ?? '',
        }
      : {
          bill_to_company: '',
          bill_to_email: '',
          bill_to_address: '',
          amount: 0,
          fuel_surcharge: 0,
          accessorials: 0,
          total: 0,
          issued_date: '',
          due_date: '',
          notes: '',
          payment_method: '',
        },
  })

  // Watch amount fields for auto-calculated total
  const amount = watch('amount') ?? 0
  const fuelSurcharge = watch('fuel_surcharge') ?? 0
  const accessorials = watch('accessorials') ?? 0
  const computedTotal = (Number(amount) || 0) + (Number(fuelSurcharge) || 0) + (Number(accessorials) || 0)

  function handleFormSubmit() {
    // Build FormData from current form values
    const form = document.getElementById('invoice-form') as HTMLFormElement
    if (form) {
      const formData = new FormData(form)
      // Override total with computed value
      formData.set('total', String(computedTotal))
      onSubmit(formData)
    }
  }

  return (
    <form
      id="invoice-form"
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-6"
    >
      {/* Invoice Number (read-only in edit mode) */}
      {isEditMode && initialData?.invoice_number && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Invoice Number
          </label>
          <div className="font-mono text-lg font-semibold text-gray-900" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {initialData.invoice_number}
          </div>
        </div>
      )}

      {/* Bill-To Section */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Bill To</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="bill_to_company" className="block text-sm font-medium text-gray-700 mb-1">
              Company *
            </label>
            <input
              type="text"
              id="bill_to_company"
              {...register('bill_to_company')}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.bill_to_company && (
              <p className="mt-1 text-xs text-red-600">{errors.bill_to_company.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="bill_to_email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="bill_to_email"
              {...register('bill_to_email')}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.bill_to_email && (
              <p className="mt-1 text-xs text-red-600">{errors.bill_to_email.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="bill_to_address" className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            id="bill_to_address"
            rows={2}
            {...register('bill_to_address')}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Amounts Section */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Amounts</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Rate Amount *
            </label>
            <input
              type="number"
              id="amount"
              step="0.01"
              min="0"
              {...register('amount')}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.amount && (
              <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="fuel_surcharge" className="block text-sm font-medium text-gray-700 mb-1">
              Fuel Surcharge
            </label>
            <input
              type="number"
              id="fuel_surcharge"
              step="0.01"
              min="0"
              {...register('fuel_surcharge')}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.fuel_surcharge && (
              <p className="mt-1 text-xs text-red-600">{errors.fuel_surcharge.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="accessorials" className="block text-sm font-medium text-gray-700 mb-1">
              Accessorials
            </label>
            <input
              type="number"
              id="accessorials"
              step="0.01"
              min="0"
              {...register('accessorials')}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.accessorials && (
              <p className="mt-1 text-xs text-red-600">{errors.accessorials.message}</p>
            )}
          </div>
        </div>

        {/* Computed Total */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Total</span>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(computedTotal)}
            </span>
          </div>
          <input type="hidden" {...register('total')} value={computedTotal} />
        </div>
      </div>

      {/* Dates Section */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Dates</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="issued_date" className="block text-sm font-medium text-gray-700 mb-1">
              Issued Date *
            </label>
            <input
              type="date"
              id="issued_date"
              {...register('issued_date')}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.issued_date && (
              <p className="mt-1 text-xs text-red-600">{errors.issued_date.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              id="due_date"
              {...register('due_date')}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.due_date && (
              <p className="mt-1 text-xs text-red-600">{errors.due_date.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          {...register('notes')}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Payment Method (edit mode only) */}
      {isEditMode && (
        <div>
          <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-1">
            Payment Method
          </label>
          <select
            id="payment_method"
            {...register('payment_method')}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select method...</option>
            <option value="check">Check</option>
            <option value="ach">ACH</option>
            <option value="wire">Wire Transfer</option>
            <option value="credit_card">Credit Card</option>
            <option value="other">Other</option>
          </select>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-white font-medium rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : isEditMode ? 'Update Invoice' : 'Create Invoice'}
        </button>
      </div>
    </form>
  )
}
