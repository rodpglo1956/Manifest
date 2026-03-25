import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { InvoicePDF } from '@/components/invoices/invoice-pdf'
import { NextResponse } from 'next/server'
import React from 'react'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Fetch invoice with joined load data
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, loads(load_number, pickup_company, delivery_company)')
      .eq('id', id)
      .single()

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

    // Prepare invoice data with joined relations
    const invoiceWithRelations = {
      ...invoice,
      organizations: org ?? null,
    }

    // Render PDF to buffer
    const buffer = await renderToBuffer(
      React.createElement(InvoicePDF, { invoice: invoiceWithRelations })
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
