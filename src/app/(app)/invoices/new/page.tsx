import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewInvoiceClient } from './new-invoice-client'
import type { Load } from '@/types/database'

interface PageProps {
  searchParams: Promise<{
    loadId?: string
  }>
}

export default async function NewInvoicePage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // If loadId is provided, create invoice directly
  if (params.loadId) {
    // Fetch the load to pre-populate form
    const { data: load } = await supabase
      .from('loads')
      .select('id, org_id, load_number, broker_name, broker_email, rate_amount, fuel_surcharge, accessorial_charges, total_charges, status')
      .eq('id', params.loadId)
      .single() as { data: (Pick<Load, 'id' | 'org_id' | 'load_number' | 'broker_name' | 'broker_email' | 'rate_amount' | 'fuel_surcharge' | 'accessorial_charges' | 'total_charges' | 'status'>) | null }

    if (!load || load.status !== 'delivered') {
      redirect('/invoices?error=load-not-deliverable')
    }

    return (
      <div className="max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold">Create Invoice</h1>
        <p className="text-sm text-gray-600">
          Creating invoice for load{' '}
          <span className="font-mono font-medium">{load.load_number}</span>
        </p>
        <NewInvoiceClient loadId={load.id} />
      </div>
    )
  }

  // No loadId - show list of delivered loads to choose from
  const { data: deliveredLoads } = await supabase
    .from('loads')
    .select('id, load_number, broker_name, total_charges, delivery_date')
    .eq('status', 'delivered')
    .order('delivery_date', { ascending: false }) as { data: Pick<Load, 'id' | 'load_number' | 'broker_name' | 'total_charges' | 'delivery_date'>[] | null }

  const loads = deliveredLoads ?? []

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Create Invoice</h1>
      <p className="text-sm text-gray-600">Select a delivered load to create an invoice from.</p>

      {loads.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No delivered loads</p>
          <p className="text-sm mt-1">Loads must be in &quot;delivered&quot; status to create an invoice.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {loads.map((load) => (
            <a
              key={load.id}
              href={`/invoices/new?loadId=${load.id}`}
              className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-sm font-medium text-primary">
                    {load.load_number ?? 'N/A'}
                  </span>
                  <span className="text-sm text-gray-600 ml-3">
                    {load.broker_name ?? 'No broker'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {load.total_charges != null
                    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(load.total_charges)
                    : '--'}
                </span>
              </div>
              {load.delivery_date && (
                <div className="text-xs text-gray-500 mt-1">
                  Delivered: {new Date(load.delivery_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
