import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { updateInvoice } from '../../actions'
import type { Invoice } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditInvoicePage({ params }: PageProps) {
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

  async function handleSubmit(formData: FormData) {
    'use server'
    const result = await updateInvoice(id, formData)
    if (!result.error) {
      redirect(`/invoices/${id}`)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Edit Invoice</h1>
      <InvoiceForm initialData={invoice} onSubmit={handleSubmit} />
    </div>
  )
}
