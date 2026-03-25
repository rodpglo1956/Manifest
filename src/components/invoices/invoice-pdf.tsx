import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import type { Invoice, Organization, Load } from '@/types/database'

// Currency formatting helper
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Professional invoice styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a5f',
  },
  companyName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
  },
  companyAddress: {
    fontSize: 9,
    color: '#666666',
    marginTop: 4,
  },
  // Invoice title
  invoiceTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
    textAlign: 'right',
  },
  invoiceNumber: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
    color: '#444444',
  },
  // Info sections
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  infoSection: {
    width: '48%',
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 10,
    marginBottom: 2,
    color: '#333333',
  },
  // Line items table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e3a5f',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 1,
  },
  tableHeaderText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    backgroundColor: '#f9f9f9',
  },
  descriptionCol: {
    width: '70%',
  },
  amountCol: {
    width: '30%',
    textAlign: 'right',
  },
  // Total row
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 2,
    backgroundColor: '#f0f4f8',
    borderTopWidth: 2,
    borderTopColor: '#1e3a5f',
  },
  totalLabel: {
    width: '70%',
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: '#1e3a5f',
  },
  totalAmount: {
    width: '30%',
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: '#1e3a5f',
  },
  // Sections
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionText: {
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.5,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#999999',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
  },
})

type InvoicePDFProps = {
  invoice: Invoice & {
    loads?: Pick<Load, 'load_number' | 'pickup_company' | 'delivery_company'> | null
    organizations?: Pick<Organization, 'name' | 'address_line1' | 'address_city' | 'address_state' | 'address_zip' | 'phone' | 'email'> | null
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--'
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getPaymentTerms(issuedDate: string | null, dueDate: string | null): string {
  if (!issuedDate || !dueDate) return 'Net 30'
  const issued = new Date(issuedDate)
  const due = new Date(dueDate)
  const diffDays = Math.round((due.getTime() - issued.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'Due on Receipt'
  return `Net ${diffDays}`
}

export function InvoicePDF({ invoice }: InvoicePDFProps) {
  const org = invoice.organizations
  const load = invoice.loads
  const companyName = org?.name || 'Company'

  const companyAddressParts = [
    org?.address_line1,
    [org?.address_city, org?.address_state, org?.address_zip].filter(Boolean).join(', '),
  ].filter(Boolean)

  const lineItems: { description: string; amount: number }[] = [
    { description: 'Freight Charges', amount: invoice.amount },
  ]
  if (invoice.fuel_surcharge > 0) {
    lineItems.push({ description: 'Fuel Surcharge', amount: invoice.fuel_surcharge })
  }
  if (invoice.accessorials > 0) {
    lineItems.push({ description: 'Accessorials', amount: invoice.accessorials })
  }

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{companyName}</Text>
            {companyAddressParts.map((line, i) => (
              <Text key={i} style={styles.companyAddress}>{line}</Text>
            ))}
            {org?.phone && <Text style={styles.companyAddress}>{org.phone}</Text>}
            {org?.email && <Text style={styles.companyAddress}>{org.email}</Text>}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
          </View>
        </View>

        {/* Bill-to and Dates */}
        <View style={styles.infoRow}>
          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <Text style={styles.infoText}>{invoice.bill_to_company}</Text>
            {invoice.bill_to_email && (
              <Text style={styles.infoText}>{invoice.bill_to_email}</Text>
            )}
            {invoice.bill_to_address && (
              <Text style={styles.infoText}>{invoice.bill_to_address}</Text>
            )}
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>Invoice Details</Text>
            <Text style={styles.infoText}>
              Issue Date: {formatDate(invoice.issued_date)}
            </Text>
            <Text style={styles.infoText}>
              Due Date: {formatDate(invoice.due_date)}
            </Text>
            {invoice.paid_date && (
              <Text style={styles.infoText}>
                Paid Date: {formatDate(invoice.paid_date)}
              </Text>
            )}
            <Text style={styles.infoText}>
              Terms: {getPaymentTerms(invoice.issued_date, invoice.due_date)}
            </Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.descriptionCol]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.amountCol]}>Amount</Text>
        </View>
        {lineItems.map((item, index) => (
          <View key={index} style={index % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
            <Text style={styles.descriptionCol}>{item.description}</Text>
            <Text style={styles.amountCol}>{formatCurrency(item.amount)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalAmount}>{formatCurrency(invoice.total)}</Text>
        </View>

        {/* Load Reference */}
        {load?.load_number && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Load Reference</Text>
            <Text style={styles.sectionText}>
              Load #{load.load_number}
              {load.pickup_company && load.delivery_company
                ? ` - ${load.pickup_company} to ${load.delivery_company}`
                : ''}
            </Text>
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.sectionText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>Thank you for your business</Text>
      </Page>
    </Document>
  )
}
