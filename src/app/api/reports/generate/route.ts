import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import {
  ProfitLossReport,
  FleetReport,
  ComplianceReport,
  DriverReport,
} from '@/components/reports/report-pdf'
import type {
  PnlData,
  FleetData,
  ComplianceData,
  DriverData,
} from '@/components/reports/report-pdf'
import { NextResponse } from 'next/server'
import React from 'react'
import type { AnalyticsSnapshot, DriverPerformance } from '@/types/database'

// ============================================================
// Auth helper
// ============================================================

async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const, supabase, user: null, orgId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) return { error: 'No organization found' as const, supabase, user, orgId: null }

  return { error: null, supabase, user, orgId: profile.org_id }
}

// ============================================================
// Data fetchers per report type
// ============================================================

type ReportType = 'pnl' | 'fleet' | 'compliance' | 'driver'

async function fetchPnlData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  startDate: string,
  endDate: string
): Promise<PnlData> {
  const { data: snapshots } = await supabase
    .from('daily_snapshots')
    .select('*')
    .eq('org_id', orgId)
    .eq('period', 'daily')
    .gte('snapshot_date', startDate)
    .lte('snapshot_date', endDate)
    .order('snapshot_date', { ascending: true })

  const snaps = (snapshots ?? []) as AnalyticsSnapshot[]
  const revenue = snaps.reduce((s, r) => s + r.revenue, 0)
  const totalMiles = snaps.reduce((s, r) => s + r.total_miles, 0)
  const totalLoads = snaps.reduce((s, r) => s + r.loads_delivered, 0)
  const fuelCosts = snaps.reduce((s, r) => s + (r.total_fuel_cost ?? 0), 0)
  const maintenanceCosts = snaps.reduce((s, r) => s + (r.total_maintenance_cost ?? 0), 0)
  const totalExpenses = snaps.reduce((s, r) => s + r.total_expenses, 0)
  const netProfit = revenue - totalExpenses

  // Monthly breakdown if range spans multiple months
  const monthMap = new Map<string, { revenue: number; expenses: number; profit: number }>()
  for (const snap of snaps) {
    const monthKey = snap.snapshot_date.slice(0, 7) // YYYY-MM
    const existing = monthMap.get(monthKey) ?? { revenue: 0, expenses: 0, profit: 0 }
    existing.revenue += snap.revenue
    existing.expenses += snap.total_expenses
    existing.profit += snap.revenue - snap.total_expenses
    monthMap.set(monthKey, existing)
  }

  const monthlyBreakdown = monthMap.size > 1
    ? Array.from(monthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, d]) => ({
          month: new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          ...d,
        }))
    : undefined

  return {
    revenue,
    revenuePerMile: totalMiles > 0 ? Math.round((revenue / totalMiles) * 100) / 100 : 0,
    revenuePerLoad: totalLoads > 0 ? Math.round((revenue / totalLoads) * 100) / 100 : 0,
    fuelCosts,
    maintenanceCosts,
    totalExpenses,
    netProfit,
    profitPerMile: totalMiles > 0 ? Math.round((netProfit / totalMiles) * 100) / 100 : 0,
    profitMargin: revenue > 0 ? Math.round((netProfit / revenue) * 1000) / 10 : 0,
    totalMiles,
    totalLoads,
    monthlyBreakdown,
  }
}

async function fetchFleetData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  startDate: string,
  endDate: string
): Promise<FleetData> {
  const [vehicleRes, snapshotRes, fuelRes, maintRes] = await Promise.all([
    supabase
      .from('vehicles')
      .select('id, unit_number, status')
      .eq('org_id', orgId),
    supabase
      .from('daily_snapshots')
      .select('*')
      .eq('org_id', orgId)
      .eq('period', 'daily')
      .gte('snapshot_date', startDate)
      .lte('snapshot_date', endDate)
      .order('snapshot_date', { ascending: true }),
    supabase
      .from('fuel_transactions')
      .select('vehicle_id, total_cost')
      .eq('org_id', orgId)
      .gte('transaction_date', `${startDate}T00:00:00Z`)
      .lte('transaction_date', `${endDate}T23:59:59Z`),
    supabase
      .from('maintenance_records')
      .select('vehicle_id, cost_total')
      .eq('org_id', orgId)
      .gte('date_in', `${startDate}T00:00:00Z`)
      .lte('date_in', `${endDate}T23:59:59Z`),
  ])

  const vehicles = vehicleRes.data ?? []
  const snaps = (snapshotRes.data ?? []) as AnalyticsSnapshot[]
  const totalMiles = snaps.reduce((s, r) => s + r.total_miles, 0)
  const avgUtil = snaps.length > 0
    ? snaps.reduce((s, r) => s + (r.fleet_utilization_pct ?? 0), 0) / snaps.length
    : null
  const avgMpg = snaps.length > 0
    ? snaps.filter(s => s.avg_mpg !== null).reduce((s, r) => s + (r.avg_mpg ?? 0), 0) /
      (snaps.filter(s => s.avg_mpg !== null).length || 1)
    : null

  // Vehicle cost map
  const vehicleNames = new Map<string, string>()
  for (const v of vehicles) vehicleNames.set(v.id, v.unit_number)

  const costMap = new Map<string, { fuel: number; maintenance: number }>()
  for (const ft of fuelRes.data ?? []) {
    const existing = costMap.get(ft.vehicle_id) ?? { fuel: 0, maintenance: 0 }
    existing.fuel += ft.total_cost
    costMap.set(ft.vehicle_id, existing)
  }
  for (const mr of maintRes.data ?? []) {
    const existing = costMap.get(mr.vehicle_id) ?? { fuel: 0, maintenance: 0 }
    existing.maintenance += mr.cost_total
    costMap.set(mr.vehicle_id, existing)
  }

  const vehicleCosts = Array.from(costMap.entries())
    .map(([vid, costs]) => ({
      unitNumber: vehicleNames.get(vid) ?? vid.slice(0, 8),
      maintenance: Math.round(costs.maintenance * 100) / 100,
      fuel: Math.round(costs.fuel * 100) / 100,
      total: Math.round((costs.fuel + costs.maintenance) * 100) / 100,
      costPerMile: totalMiles > 0
        ? Math.round(((costs.fuel + costs.maintenance) / (totalMiles / vehicles.length)) * 100) / 100
        : 0,
    }))
    .sort((a, b) => b.total - a.total)

  return {
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter(v => v.status === 'active').length,
    inShop: vehicles.filter(v => v.status === 'in_shop').length,
    utilization: avgUtil !== null ? Math.round(avgUtil * 10) / 10 : null,
    avgMpg: avgMpg !== null ? Math.round(avgMpg * 10) / 10 : null,
    totalMiles,
    vehicleCosts,
  }
}

async function fetchComplianceData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
): Promise<ComplianceData> {
  const [snapshotRes, itemsRes, inspRes, driversRes, compItemsRes] = await Promise.all([
    supabase
      .from('daily_snapshots')
      .select('compliance_score')
      .eq('org_id', orgId)
      .eq('period', 'daily')
      .order('snapshot_date', { ascending: false })
      .limit(1),
    supabase
      .from('compliance_items')
      .select('title, due_date, driver_id')
      .eq('org_id', orgId)
      .eq('status', 'overdue')
      .order('due_date', { ascending: true })
      .limit(20),
    supabase
      .from('inspections')
      .select('result')
      .eq('org_id', orgId),
    supabase
      .from('drivers')
      .select('id, first_name, last_name')
      .eq('org_id', orgId),
    supabase
      .from('compliance_items')
      .select('driver_id, status')
      .eq('org_id', orgId),
  ])

  const latestSnap = (snapshotRes.data ?? [])[0] as { compliance_score: number | null } | undefined
  const driverNames = new Map<string, string>()
  for (const d of driversRes.data ?? []) {
    driverNames.set(d.id, `${d.first_name} ${d.last_name}`)
  }

  const overdueItems = (itemsRes.data ?? []).map(item => ({
    name: item.title,
    dueDate: item.due_date ? new Date(item.due_date).toLocaleDateString('en-US') : '--',
    driver: item.driver_id ? driverNames.get(item.driver_id) : undefined,
  }))

  const inspections = (inspRes.data ?? [])
  const passed = inspections.filter(i => i.result === 'pass').length
  const failed = inspections.filter(i => i.result === 'fail').length
  const conditional = inspections.filter(i => i.result === 'conditional').length

  // DQ file completeness per driver
  const driverItemsMap = new Map<string, { total: number; completed: number }>()
  for (const ci of compItemsRes.data ?? []) {
    if (!ci.driver_id) continue
    const existing = driverItemsMap.get(ci.driver_id) ?? { total: 0, completed: 0 }
    existing.total += 1
    if (ci.status === 'completed') existing.completed += 1
    driverItemsMap.set(ci.driver_id, existing)
  }

  const driverDqFiles = Array.from(driverItemsMap.entries())
    .map(([driverId, counts]) => ({
      name: driverNames.get(driverId) ?? 'Unknown',
      completeness: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0,
    }))
    .sort((a, b) => a.completeness - b.completeness)

  return {
    healthScore: latestSnap?.compliance_score ?? null,
    overdueItems,
    inspections: { total: inspections.length, passed, failed, conditional },
    driverDqFiles,
  }
}

async function fetchDriverData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  startDate: string,
  endDate: string
): Promise<DriverData> {
  const [perfRes, driversRes] = await Promise.all([
    supabase
      .from('driver_performance')
      .select('*')
      .eq('org_id', orgId)
      .gte('period_start', startDate)
      .lte('period_start', endDate)
      .order('revenue_generated', { ascending: false }),
    supabase
      .from('drivers')
      .select('id, first_name, last_name')
      .eq('org_id', orgId),
  ])

  const driverNames = new Map<string, string>()
  for (const d of driversRes.data ?? []) {
    driverNames.set(d.id, `${d.first_name} ${d.last_name}`)
  }

  // Aggregate by driver
  const driverMap = new Map<string, {
    loads: number; miles: number; revenue: number
    onTimePct: number | null; mpg: number | null
    safetyIncidents: number; complianceScore: number | null
    count: number
  }>()

  for (const perf of (perfRes.data ?? []) as DriverPerformance[]) {
    const existing = driverMap.get(perf.driver_id)
    if (!existing) {
      driverMap.set(perf.driver_id, {
        loads: perf.loads_completed,
        miles: perf.miles_driven,
        revenue: perf.revenue_generated,
        onTimePct: perf.on_time_pct,
        mpg: perf.fuel_efficiency,
        safetyIncidents: perf.safety_incidents,
        complianceScore: perf.compliance_score,
        count: 1,
      })
    } else {
      existing.loads += perf.loads_completed
      existing.miles += perf.miles_driven
      existing.revenue += perf.revenue_generated
      existing.safetyIncidents += perf.safety_incidents
      if (perf.on_time_pct !== null) {
        existing.onTimePct = existing.onTimePct !== null
          ? (existing.onTimePct * existing.count + perf.on_time_pct) / (existing.count + 1)
          : perf.on_time_pct
      }
      if (perf.fuel_efficiency !== null) {
        existing.mpg = existing.mpg !== null
          ? (existing.mpg * existing.count + perf.fuel_efficiency) / (existing.count + 1)
          : perf.fuel_efficiency
      }
      if (perf.compliance_score !== null) {
        existing.complianceScore = existing.complianceScore !== null
          ? Math.round((existing.complianceScore + perf.compliance_score) / 2)
          : perf.compliance_score
      }
      existing.count += 1
    }
  }

  const drivers = Array.from(driverMap.entries())
    .map(([driverId, d]) => ({
      name: driverNames.get(driverId) ?? 'Unknown',
      loads: d.loads,
      miles: d.miles,
      revenue: d.revenue,
      onTimePct: d.onTimePct !== null ? Math.round(d.onTimePct * 10) / 10 : null,
      mpg: d.mpg !== null ? Math.round(d.mpg * 10) / 10 : null,
      safetyIncidents: d.safetyIncidents,
      complianceScore: d.complianceScore,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  const totalLoads = drivers.reduce((s, d) => s + d.loads, 0)
  const totalRevenue = drivers.reduce((s, d) => s + d.revenue, 0)
  const onTimeValues = drivers.filter(d => d.onTimePct !== null).map(d => d.onTimePct!)
  const avgOnTime = onTimeValues.length > 0
    ? Math.round((onTimeValues.reduce((s, v) => s + v, 0) / onTimeValues.length) * 10) / 10
    : null

  const topPerformer = drivers.length > 0
    ? { name: drivers[0].name, metric: `Highest revenue: $${drivers[0].revenue.toLocaleString()}` }
    : null

  return { drivers, topPerformer, totalLoads, totalRevenue, avgOnTime }
}

// ============================================================
// POST handler
// ============================================================

export async function POST(request: Request) {
  try {
    const { error, supabase, orgId } = await getAuthContext()
    if (error || !orgId) {
      return NextResponse.json({ error: error ?? 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { report_type, start_date, end_date } = body as {
      report_type: ReportType
      start_date: string
      end_date: string
    }

    if (!report_type || !start_date || !end_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validTypes: ReportType[] = ['pnl', 'fleet', 'compliance', 'driver']
    if (!validTypes.includes(report_type)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    // Fetch organization name
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single()

    const orgName = org?.name ?? 'Organization'
    const dateRange = { start: start_date, end: end_date }

    // Build PDF element based on type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pdfElement: any

    const reportTitles: Record<ReportType, string> = {
      pnl: 'P&L Statement',
      fleet: 'Fleet Summary',
      compliance: 'Compliance Report',
      driver: 'Driver Performance',
    }

    switch (report_type) {
      case 'pnl': {
        const data = await fetchPnlData(supabase, orgId, start_date, end_date)
        pdfElement = React.createElement(ProfitLossReport, { org: orgName, data, dateRange })
        break
      }
      case 'fleet': {
        const data = await fetchFleetData(supabase, orgId, start_date, end_date)
        pdfElement = React.createElement(FleetReport, { org: orgName, data, dateRange })
        break
      }
      case 'compliance': {
        const data = await fetchComplianceData(supabase, orgId)
        pdfElement = React.createElement(ComplianceReport, { org: orgName, data, dateRange })
        break
      }
      case 'driver': {
        const data = await fetchDriverData(supabase, orgId, start_date, end_date)
        pdfElement = React.createElement(DriverReport, { org: orgName, data, dateRange })
        break
      }
    }

    // Render PDF to buffer
    const buffer = await renderToBuffer(pdfElement)

    // Store in Supabase Storage
    const filename = `${report_type}_${start_date}_${end_date}.pdf`
    const storagePath = `${orgId}/${filename}`

    await supabase.storage
      .from('reports')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    // Create signed URL (1 hour expiry)
    const { data: signedUrlData } = await supabase.storage
      .from('reports')
      .createSignedUrl(storagePath, 3600)

    return NextResponse.json({
      url: signedUrlData?.signedUrl ?? null,
      filename,
      report_type: reportTitles[report_type],
      generated_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Report generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
