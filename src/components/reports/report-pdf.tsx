import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

// ============================================================
// Shared styles (follows invoice-pdf.tsx professional blue theme)
// ============================================================

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a5f',
  },
  companyName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
  },
  reportTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#333333',
    marginTop: 8,
  },
  dateRange: {
    fontSize: 9,
    color: '#666666',
    marginTop: 4,
  },
  generatedAt: {
    fontSize: 8,
    color: '#999999',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowAlt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  label: {
    fontSize: 10,
    color: '#333333',
    width: '60%',
  },
  value: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    width: '40%',
    textAlign: 'right',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e3a5f',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 1,
  },
  tableHeaderText: {
    color: '#ffffff',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  tableCell: {
    fontSize: 9,
    color: '#333333',
  },
  tableCellBold: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 2,
    backgroundColor: '#f0f4f8',
    borderTopWidth: 2,
    borderTopColor: '#1e3a5f',
  },
  totalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#1e3a5f',
    width: '60%',
  },
  totalValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#1e3a5f',
    width: '40%',
    textAlign: 'right',
  },
  highlight: {
    backgroundColor: '#eef6ff',
    padding: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1e3a5f',
  },
  highlightText: {
    fontSize: 10,
    color: '#1e3a5f',
    fontFamily: 'Helvetica-Bold',
  },
  highlightSubText: {
    fontSize: 9,
    color: '#333333',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999999',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
})

// ============================================================
// Helpers
// ============================================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

function formatPercent(n: number | null): string {
  if (n === null) return '--'
  return `${n.toFixed(1)}%`
}

// ============================================================
// Shared header component
// ============================================================

type DateRange = { start: string; end: string }

function ReportHeader({ orgName, title, dateRange }: {
  orgName: string
  title: string
  dateRange: DateRange
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.companyName}>{orgName}</Text>
      <Text style={styles.reportTitle}>{title}</Text>
      <Text style={styles.dateRange}>
        Period: {dateRange.start} to {dateRange.end}
      </Text>
      <Text style={styles.generatedAt}>
        Generated: {new Date().toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })}
      </Text>
    </View>
  )
}

// ============================================================
// Report data types
// ============================================================

export type PnlData = {
  revenue: number
  revenuePerMile: number
  revenuePerLoad: number
  fuelCosts: number
  maintenanceCosts: number
  totalExpenses: number
  netProfit: number
  profitPerMile: number
  profitMargin: number
  totalMiles: number
  totalLoads: number
  monthlyBreakdown?: { month: string; revenue: number; expenses: number; profit: number }[]
}

export type FleetData = {
  totalVehicles: number
  activeVehicles: number
  inShop: number
  utilization: number | null
  avgMpg: number | null
  totalMiles: number
  vehicleCosts: { unitNumber: string; maintenance: number; fuel: number; total: number; costPerMile: number }[]
}

export type ComplianceData = {
  healthScore: number | null
  overdueItems: { name: string; dueDate: string; driver?: string }[]
  inspections: { total: number; passed: number; failed: number; conditional: number }
  driverDqFiles: { name: string; completeness: number }[]
}

export type DriverData = {
  drivers: {
    name: string
    loads: number
    miles: number
    revenue: number
    onTimePct: number | null
    mpg: number | null
    safetyIncidents: number
    complianceScore: number | null
  }[]
  topPerformer: { name: string; metric: string } | null
  totalLoads: number
  totalRevenue: number
  avgOnTime: number | null
}

// ============================================================
// 1. Profit & Loss Report
// ============================================================

export function ProfitLossReport({ org, data, dateRange }: {
  org: string
  data: PnlData
  dateRange: DateRange
}) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <ReportHeader orgName={org} title="Profit & Loss Statement" dateRange={dateRange} />

        <Text style={styles.sectionTitle}>Revenue</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Total Revenue</Text>
          <Text style={styles.value}>{formatCurrency(data.revenue)}</Text>
        </View>
        <View style={styles.rowAlt}>
          <Text style={styles.label}>Revenue per Mile</Text>
          <Text style={styles.value}>{formatCurrency(data.revenuePerMile)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Revenue per Load</Text>
          <Text style={styles.value}>{formatCurrency(data.revenuePerLoad)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Expenses</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Fuel Costs</Text>
          <Text style={styles.value}>{formatCurrency(data.fuelCosts)}</Text>
        </View>
        <View style={styles.rowAlt}>
          <Text style={styles.label}>Maintenance Costs</Text>
          <Text style={styles.value}>{formatCurrency(data.maintenanceCosts)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Expenses</Text>
          <Text style={styles.totalValue}>{formatCurrency(data.totalExpenses)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Profitability</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Net Profit</Text>
          <Text style={styles.value}>{formatCurrency(data.netProfit)}</Text>
        </View>
        <View style={styles.rowAlt}>
          <Text style={styles.label}>Profit per Mile</Text>
          <Text style={styles.value}>{formatCurrency(data.profitPerMile)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Profit Margin</Text>
          <Text style={styles.value}>{formatPercent(data.profitMargin)}</Text>
        </View>

        {data.monthlyBreakdown && data.monthlyBreakdown.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: '25%' }]}>Month</Text>
              <Text style={[styles.tableHeaderText, { width: '25%', textAlign: 'right' }]}>Revenue</Text>
              <Text style={[styles.tableHeaderText, { width: '25%', textAlign: 'right' }]}>Expenses</Text>
              <Text style={[styles.tableHeaderText, { width: '25%', textAlign: 'right' }]}>Profit</Text>
            </View>
            {data.monthlyBreakdown.map((m, i) => (
              <View key={i} style={i % 2 === 1 ? styles.rowAlt : styles.row}>
                <Text style={[styles.tableCell, { width: '25%' }]}>{m.month}</Text>
                <Text style={[styles.tableCell, { width: '25%', textAlign: 'right' }]}>{formatCurrency(m.revenue)}</Text>
                <Text style={[styles.tableCell, { width: '25%', textAlign: 'right' }]}>{formatCurrency(m.expenses)}</Text>
                <Text style={[styles.tableCell, { width: '25%', textAlign: 'right' }]}>{formatCurrency(m.profit)}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.footer}>
          {org} - Profit & Loss Statement - Confidential
        </Text>
      </Page>
    </Document>
  )
}

// ============================================================
// 2. Fleet Report
// ============================================================

export function FleetReport({ org, data, dateRange }: {
  org: string
  data: FleetData
  dateRange: DateRange
}) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <ReportHeader orgName={org} title="Fleet Summary Report" dateRange={dateRange} />

        <Text style={styles.sectionTitle}>Fleet Summary</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Total Vehicles</Text>
          <Text style={styles.value}>{formatNumber(data.totalVehicles)}</Text>
        </View>
        <View style={styles.rowAlt}>
          <Text style={styles.label}>Active Vehicles</Text>
          <Text style={styles.value}>{formatNumber(data.activeVehicles)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>In Shop</Text>
          <Text style={styles.value}>{formatNumber(data.inShop)}</Text>
        </View>
        <View style={styles.rowAlt}>
          <Text style={styles.label}>Utilization</Text>
          <Text style={styles.value}>{formatPercent(data.utilization)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Average MPG</Text>
          <Text style={styles.value}>{data.avgMpg !== null ? formatNumber(data.avgMpg, 1) : '--'}</Text>
        </View>
        <View style={styles.rowAlt}>
          <Text style={styles.label}>Total Miles Driven</Text>
          <Text style={styles.value}>{formatNumber(data.totalMiles)}</Text>
        </View>

        {data.vehicleCosts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Vehicle Cost Breakdown</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: '20%' }]}>Vehicle</Text>
              <Text style={[styles.tableHeaderText, { width: '20%', textAlign: 'right' }]}>Maintenance</Text>
              <Text style={[styles.tableHeaderText, { width: '20%', textAlign: 'right' }]}>Fuel</Text>
              <Text style={[styles.tableHeaderText, { width: '20%', textAlign: 'right' }]}>Total</Text>
              <Text style={[styles.tableHeaderText, { width: '20%', textAlign: 'right' }]}>Cost/Mile</Text>
            </View>
            {data.vehicleCosts.map((v, i) => (
              <View key={i} style={i % 2 === 1 ? styles.rowAlt : styles.row}>
                <Text style={[styles.tableCellBold, { width: '20%' }]}>{v.unitNumber}</Text>
                <Text style={[styles.tableCell, { width: '20%', textAlign: 'right' }]}>{formatCurrency(v.maintenance)}</Text>
                <Text style={[styles.tableCell, { width: '20%', textAlign: 'right' }]}>{formatCurrency(v.fuel)}</Text>
                <Text style={[styles.tableCell, { width: '20%', textAlign: 'right' }]}>{formatCurrency(v.total)}</Text>
                <Text style={[styles.tableCell, { width: '20%', textAlign: 'right' }]}>{formatCurrency(v.costPerMile)}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.footer}>
          {org} - Fleet Summary Report - Confidential
        </Text>
      </Page>
    </Document>
  )
}

// ============================================================
// 3. Compliance Report
// ============================================================

export function ComplianceReport({ org, data, dateRange }: {
  org: string
  data: ComplianceData
  dateRange: DateRange
}) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <ReportHeader orgName={org} title="Compliance Report" dateRange={dateRange} />

        <Text style={styles.sectionTitle}>Health Score</Text>
        <View style={styles.highlight}>
          <Text style={styles.highlightText}>
            Compliance Score: {data.healthScore !== null ? `${data.healthScore}/100` : 'N/A'}
          </Text>
          <Text style={styles.highlightSubText}>
            {data.healthScore !== null && data.healthScore >= 80
              ? 'Good standing - continue maintaining compliance'
              : data.healthScore !== null && data.healthScore >= 60
              ? 'Needs attention - review overdue items'
              : 'Critical - immediate action required'}
          </Text>
        </View>

        {data.overdueItems.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Overdue Items ({data.overdueItems.length})</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: '45%' }]}>Item</Text>
              <Text style={[styles.tableHeaderText, { width: '30%' }]}>Due Date</Text>
              <Text style={[styles.tableHeaderText, { width: '25%' }]}>Driver</Text>
            </View>
            {data.overdueItems.map((item, i) => (
              <View key={i} style={i % 2 === 1 ? styles.rowAlt : styles.row}>
                <Text style={[styles.tableCell, { width: '45%' }]}>{item.name}</Text>
                <Text style={[styles.tableCell, { width: '30%' }]}>{item.dueDate}</Text>
                <Text style={[styles.tableCell, { width: '25%' }]}>{item.driver ?? '--'}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>Inspection Summary</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Total Inspections</Text>
          <Text style={styles.value}>{formatNumber(data.inspections.total)}</Text>
        </View>
        <View style={styles.rowAlt}>
          <Text style={styles.label}>Passed</Text>
          <Text style={styles.value}>{formatNumber(data.inspections.passed)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Failed</Text>
          <Text style={styles.value}>{formatNumber(data.inspections.failed)}</Text>
        </View>
        <View style={styles.rowAlt}>
          <Text style={styles.label}>Conditional</Text>
          <Text style={styles.value}>{formatNumber(data.inspections.conditional)}</Text>
        </View>

        {data.driverDqFiles.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Driver DQ File Completeness</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: '60%' }]}>Driver</Text>
              <Text style={[styles.tableHeaderText, { width: '40%', textAlign: 'right' }]}>Completeness</Text>
            </View>
            {data.driverDqFiles.map((d, i) => (
              <View key={i} style={i % 2 === 1 ? styles.rowAlt : styles.row}>
                <Text style={[styles.tableCell, { width: '60%' }]}>{d.name}</Text>
                <Text style={[styles.tableCell, { width: '40%', textAlign: 'right' }]}>
                  {formatPercent(d.completeness)}
                </Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.footer}>
          {org} - Compliance Report - Confidential
        </Text>
      </Page>
    </Document>
  )
}

// ============================================================
// 4. Driver Performance Report
// ============================================================

export function DriverReport({ org, data, dateRange }: {
  org: string
  data: DriverData
  dateRange: DateRange
}) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <ReportHeader orgName={org} title="Driver Performance Report" dateRange={dateRange} />

        {data.topPerformer && (
          <View style={styles.highlight}>
            <Text style={styles.highlightText}>
              Top Performer: {data.topPerformer.name}
            </Text>
            <Text style={styles.highlightSubText}>{data.topPerformer.metric}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Summary Statistics</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Total Loads Completed</Text>
          <Text style={styles.value}>{formatNumber(data.totalLoads)}</Text>
        </View>
        <View style={styles.rowAlt}>
          <Text style={styles.label}>Total Revenue Generated</Text>
          <Text style={styles.value}>{formatCurrency(data.totalRevenue)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Average On-Time %</Text>
          <Text style={styles.value}>{formatPercent(data.avgOnTime)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Driver Scorecards</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { width: '16%' }]}>Driver</Text>
          <Text style={[styles.tableHeaderText, { width: '10%', textAlign: 'right' }]}>Loads</Text>
          <Text style={[styles.tableHeaderText, { width: '14%', textAlign: 'right' }]}>Miles</Text>
          <Text style={[styles.tableHeaderText, { width: '15%', textAlign: 'right' }]}>Revenue</Text>
          <Text style={[styles.tableHeaderText, { width: '12%', textAlign: 'right' }]}>On-Time</Text>
          <Text style={[styles.tableHeaderText, { width: '10%', textAlign: 'right' }]}>MPG</Text>
          <Text style={[styles.tableHeaderText, { width: '11%', textAlign: 'right' }]}>Safety</Text>
          <Text style={[styles.tableHeaderText, { width: '12%', textAlign: 'right' }]}>Compl.</Text>
        </View>
        {data.drivers.map((d, i) => (
          <View key={i} style={i % 2 === 1 ? styles.rowAlt : styles.row}>
            <Text style={[styles.tableCellBold, { width: '16%' }]}>{d.name}</Text>
            <Text style={[styles.tableCell, { width: '10%', textAlign: 'right' }]}>{formatNumber(d.loads)}</Text>
            <Text style={[styles.tableCell, { width: '14%', textAlign: 'right' }]}>{formatNumber(d.miles)}</Text>
            <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>{formatCurrency(d.revenue)}</Text>
            <Text style={[styles.tableCell, { width: '12%', textAlign: 'right' }]}>{formatPercent(d.onTimePct)}</Text>
            <Text style={[styles.tableCell, { width: '10%', textAlign: 'right' }]}>{d.mpg !== null ? formatNumber(d.mpg, 1) : '--'}</Text>
            <Text style={[styles.tableCell, { width: '11%', textAlign: 'right' }]}>{formatNumber(d.safetyIncidents)}</Text>
            <Text style={[styles.tableCell, { width: '12%', textAlign: 'right' }]}>{d.complianceScore !== null ? `${d.complianceScore}` : '--'}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          {org} - Driver Performance Report - Confidential
        </Text>
      </Page>
    </Document>
  )
}
