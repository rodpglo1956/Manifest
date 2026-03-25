'use client'

import { useRealtimeInvoices } from '@/hooks/use-realtime-invoices'
import { InvoiceList } from '@/components/invoices/invoice-list'
import type { Invoice } from '@/types/database'

interface InvoicesViewProps {
  invoices: Invoice[]
  orgId: string | null
}

export function InvoicesView({ invoices, orgId }: InvoicesViewProps) {
  // Subscribe to realtime changes
  useRealtimeInvoices(orgId)

  return <InvoiceList invoices={invoices} />
}
