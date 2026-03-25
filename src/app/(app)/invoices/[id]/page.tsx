import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InvoiceDetail } from '@/components/invoices/invoice-detail'
import type { Invoice, Load } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch invoice
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('id, org_id, load_id, invoice_number, bill_to_company, bill_to_email, bill_to_address, amount, fuel_surcharge, accessorials, total, status, issued_date, due_date, paid_date, paid_amount, payment_method, notes, pdf_url, created_at, updated_at')
    .eq('id', id)
    .single() as { data: Invoice | null; error: unknown }

  if (error || !invoice) {
    notFound()
  }

  // Fetch linked load number for display
  let loadNumber: string | null = null
  if (invoice.load_id) {
    const { data: load } = await supabase
      .from('loads')
      .select('load_number')
      .eq('id', invoice.load_id)
      .single() as { data: Pick<Load, 'load_number'> | null }
    loadNumber = load?.load_number ?? null
  }

  const invoiceWithLoad = {
    ...invoice,
    load_number: loadNumber,
  }

  return (
    <div className="max-w-3xl">
      <InvoiceDetail invoice={invoiceWithLoad} />
    </div>
  )
}
