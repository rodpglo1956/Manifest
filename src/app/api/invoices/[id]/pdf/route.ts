import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { InvoicePDF } from '@/components/invoices/invoice-pdf'
import { NextResponse } from 'next/server'
import React from 'react'
import type { Invoice } from '@/types/database'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Fetch invoice
    const { data, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single()
    const invoice = data as Invoice | null

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Fetch organization for company info on PDF
    const { data: org } = await supabase
      .from('organizations')
      .select('name, address_line1, address_city, address_state, address_zip, phone, email')
      .eq('id', invoice.org_id)
      .single()

    // Fetch related load for reference numbers
    const { data: load } = invoice.load_id
      ? await supabase.from('loads').select('load_number, pickup_company, delivery_company').eq('id', invoice.load_id).single()
      : { data: null }

    // Prepare invoice data with joined relations
    const invoiceWithRelations = {
      ...invoice,
      organizations: org ?? null,
      loads: load ?? null,
    }

    // Render PDF to buffer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(
      React.createElement(InvoicePDF, { invoice: invoiceWithRelations }) as any
    )

    // Store PDF in Supabase Storage unconditionally
    const storagePath = `${invoice.org_id}/${invoice.id}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('invoice-documents')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (!uploadError) {
      // Get public URL and update invoice record
      const { data: urlData } = supabase.storage
        .from('invoice-documents')
        .getPublicUrl(storagePath)

      if (urlData?.publicUrl) {
        await supabase
          .from('invoices')
          .update({ pdf_url: urlData.publicUrl })
          .eq('id', invoice.id)
      }
    }

    // Return PDF binary response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${invoice.invoice_number}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
