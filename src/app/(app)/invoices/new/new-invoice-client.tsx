'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { createInvoiceFromLoad } from '../actions'

interface NewInvoiceClientProps {
  loadId: string
}

export function NewInvoiceClient({ loadId }: NewInvoiceClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    startTransition(async () => {
      const result = await createInvoiceFromLoad(loadId)
      if (result.error) {
        alert(result.error)
      } else if (result.id) {
        router.push(`/invoices/${result.id}`)
      }
    })
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6 text-center space-y-4">
      <p className="text-sm text-gray-600">
        This will create a draft invoice with auto-populated data from the load
        (broker info, rate, fuel surcharge, accessorials). You can edit the invoice after creation.
      </p>
      <button
        type="button"
        onClick={handleCreate}
        disabled={isPending}
        className="px-6 py-2 bg-primary text-white font-medium rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Creating...' : 'Create Invoice'}
      </button>
    </div>
  )
}
