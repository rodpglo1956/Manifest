'use server'

import { createClient } from '@/lib/supabase/server'
import { canTransitionInvoice } from '@/lib/invoice-status'
import { revalidatePath } from 'next/cache'
import type { InvoiceStatus } from '@/types/database'

/**
 * Mark an invoice as sent. Validates draft -> sent transition.
 */
export async function markInvoiceSent(
  invoiceId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('id, status')
    .eq('id', invoiceId)
    .single()

  if (fetchError || !invoice) {
    return { error: 'Invoice not found' }
  }

  if (!canTransitionInvoice(invoice.status as InvoiceStatus, 'sent')) {
    return { error: `Cannot transition invoice from ${invoice.status} to sent` }
  }

  const { error: updateError } = await supabase
    .from('invoices')
    .update({ status: 'sent', updated_at: new Date().toISOString() })
    .eq('id', invoiceId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${invoiceId}`)
  return {}
}

/**
 * Mark an invoice as paid with payment details.
 * Also transitions the linked load to 'paid' status.
 */
export async function markInvoicePaid(
  invoiceId: string,
  paidDate: string,
  paidAmount: number,
  paymentMethod: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('id, status, load_id')
    .eq('id', invoiceId)
    .single()

  if (fetchError || !invoice) {
    return { error: 'Invoice not found' }
  }

  if (!canTransitionInvoice(invoice.status as InvoiceStatus, 'paid')) {
    return { error: `Cannot transition invoice from ${invoice.status} to paid` }
  }

  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      paid_date: paidDate,
      paid_amount: paidAmount,
      payment_method: paymentMethod,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)

  if (updateError) {
    return { error: updateError.message }
  }

  // Also update linked load status to 'paid'
  if (invoice.load_id) {
    await supabase
      .from('loads')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', invoice.load_id)
  }

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath('/loads')
  return {}
}

/**
 * Mark an invoice as void. Valid from draft, sent, or overdue.
 */
export async function markInvoiceVoid(
  invoiceId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('id, status')
    .eq('id', invoiceId)
    .single()

  if (fetchError || !invoice) {
    return { error: 'Invoice not found' }
  }

  if (!canTransitionInvoice(invoice.status as InvoiceStatus, 'void')) {
    return { error: `Cannot transition invoice from ${invoice.status} to void` }
  }

  const { error: updateError } = await supabase
    .from('invoices')
    .update({ status: 'void', updated_at: new Date().toISOString() })
    .eq('id', invoiceId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${invoiceId}`)
  return {}
}
