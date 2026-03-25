import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { InvoiceFilters } from '@/components/invoices/invoice-filters'
import { InvoicesView } from './invoices-view'
import type { Invoice, InvoiceStatus } from '@/types/database'

interface PageProps {
  searchParams: Promise<{
    status?: string
    date_from?: string
    date_to?: string
    customer?: string
  }>
}

export default async function InvoicesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Get user org_id
  const { data: { user } } = await supabase.auth.getUser()
  let orgId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()
    orgId = profile?.org_id ?? null
  }

  // Build invoices query with filters
  let query = supabase
    .from('invoices')
    .select('id, org_id, load_id, invoice_number, bill_to_company, bill_to_email, bill_to_address, amount, fuel_surcharge, accessorials, total, status, issued_date, due_date, paid_date, paid_amount, payment_method, notes, pdf_url, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (params.status) {
    query = query.eq('status', params.status as InvoiceStatus)
  }
  if (params.date_from) {
    query = query.gte('issued_date', params.date_from)
  }
  if (params.date_to) {
    query = query.lte('issued_date', params.date_to)
  }
  if (params.customer) {
    query = query.ilike('bill_to_company', `%${params.customer}%`)
  }

  const { data: rawInvoices } = await query as { data: Invoice[] | null }
  const invoices = rawInvoices ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Link
          href="/invoices/new"
          className="px-4 py-2 bg-primary text-white font-medium rounded-md hover:bg-primary-hover transition-colors"
        >
          New Invoice
        </Link>
      </div>

      <Suspense fallback={null}>
        <InvoiceFilters />
      </Suspense>

      <InvoicesView invoices={invoices} orgId={orgId} />
    </div>
  )
}
