import type { AnalyticsSnapshot } from '@/types/database'

// Backward compat alias
type DailySnapshot = AnalyticsSnapshot

type WeeklyVolume = {
  week: string
  booked: number
  delivered: number
}

/**
 * Groups snapshots by ISO week number, sums loads_booked and loads_delivered.
 */
export function aggregateWeeklyVolume(snapshots: DailySnapshot[]): WeeklyVolume[] {
  if (snapshots.length === 0) return []

  const weekMap = new Map<number, { booked: number; delivered: number }>()

  for (const snap of snapshots) {
    const weekNum = getISOWeek(snap.snapshot_date)
    const existing = weekMap.get(weekNum) ?? { booked: 0, delivered: 0 }
    existing.booked += snap.loads_booked
    existing.delivered += snap.loads_delivered
    weekMap.set(weekNum, existing)
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([weekNum, data]) => ({
      week: `W${weekNum}`,
      booked: data.booked,
      delivered: data.delivered,
    }))
}

/**
 * Filters snapshots to current month, computes aggregated on-time percentage.
 * Returns 0 if no deliveries in current month.
 */
export function calculateCurrentMonthOnTime(snapshots: DailySnapshot[]): number {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-indexed

  const currentMonthSnapshots = snapshots.filter((snap) => {
    const date = new Date(snap.snapshot_date + 'T00:00:00')
    return date.getFullYear() === currentYear && date.getMonth() === currentMonth
  })

  const totalDeliveries = currentMonthSnapshots.reduce((sum, s) => sum + s.total_deliveries, 0)
  if (totalDeliveries === 0) return 0

  const totalOnTime = currentMonthSnapshots.reduce((sum, s) => sum + s.on_time_deliveries, 0)
  return Math.round((totalOnTime / totalDeliveries) * 100)
}

/**
 * Format a date string like "2026-03-15" to "Mar 15" for chart x-axis labels.
 */
export function formatChartDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getDate()}`
}

/**
 * Format a number as currency: 1234 -> "$1,234"
 */
export function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

/**
 * Get ISO week number from a date string.
 */
function getISOWeek(dateStr: string): number {
  const date = new Date(dateStr + 'T00:00:00')
  const dayOfYear = getDayOfYear(date)
  const dayOfWeek = date.getDay() || 7 // Convert Sunday=0 to 7
  // ISO week: week 1 contains the first Thursday of the year
  const weekNum = Math.ceil((dayOfYear - dayOfWeek + 10) / 7)
  return weekNum
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

// ============================================================
// Phase 11: Extended helpers
// ============================================================

/**
 * Format a number as percentage: 85.5 -> "85.5%"
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

/**
 * Format a number with comma separators: 12345 -> "12,345"
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

/**
 * Compare current vs previous period for a given metric.
 * Returns the summed current value, absolute change, and percentage change.
 */
export function calculatePeriodComparison(
  current: AnalyticsSnapshot[],
  previous: AnalyticsSnapshot[],
  metric: keyof AnalyticsSnapshot
): { value: number; change: number; changePercent: number } {
  const sum = (snapshots: AnalyticsSnapshot[]): number =>
    snapshots.reduce((acc, s) => {
      const val = s[metric]
      return acc + (typeof val === 'number' ? val : 0)
    }, 0)

  const currentValue = sum(current)
  const previousValue = sum(previous)
  const change = currentValue - previousValue
  const changePercent = previousValue !== 0
    ? Math.round((change / previousValue) * 1000) / 10
    : currentValue > 0 ? 100 : 0

  return { value: currentValue, change, changePercent }
}

/**
 * Aggregate daily snapshots into monthly summaries.
 * Groups by YYYY-MM, sums countable fields, averages rate fields.
 */
export function aggregateMonthlyMetrics(snapshots: AnalyticsSnapshot[]): AnalyticsSnapshot[] {
  if (snapshots.length === 0) return []

  const monthMap = new Map<string, AnalyticsSnapshot[]>()

  for (const snap of snapshots) {
    if (snap.period !== 'daily') continue
    const monthKey = snap.snapshot_date.slice(0, 7) // YYYY-MM
    const existing = monthMap.get(monthKey) ?? []
    existing.push(snap)
    monthMap.set(monthKey, existing)
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, dailies]) => {
      const totalMiles = dailies.reduce((s, d) => s + d.total_miles, 0)
      const totalRevenue = dailies.reduce((s, d) => s + d.revenue, 0)
      const totalExpenses = dailies.reduce((s, d) => s + d.total_expenses, 0)
      const totalDeliveries = dailies.reduce((s, d) => s + d.total_deliveries, 0)
      const onTimeDeliveries = dailies.reduce((s, d) => s + d.on_time_deliveries, 0)

      return {
        id: `monthly-${monthKey}`,
        org_id: dailies[0].org_id,
        snapshot_date: `${monthKey}-01`,
        period: 'monthly' as const,
        loads_booked: dailies.reduce((s, d) => s + d.loads_booked, 0),
        loads_delivered: dailies.reduce((s, d) => s + d.loads_delivered, 0),
        loads_canceled: dailies.reduce((s, d) => s + d.loads_canceled, 0),
        revenue: totalRevenue,
        total_miles: totalMiles,
        revenue_per_mile: totalMiles > 0 ? Math.round((totalRevenue / totalMiles) * 100) / 100 : 0,
        on_time_deliveries: onTimeDeliveries,
        total_deliveries: totalDeliveries,
        on_time_percentage: totalDeliveries > 0
          ? Math.round((onTimeDeliveries / totalDeliveries) * 10000) / 100
          : 0,
        active_drivers: Math.max(...dailies.map(d => d.active_drivers)),
        invoices_generated: dailies.reduce((s, d) => s + d.invoices_generated, 0),
        invoices_paid: dailies.reduce((s, d) => s + d.invoices_paid, 0),
        total_expenses: totalExpenses,
        net_profit: totalRevenue - totalExpenses,
        cost_per_mile: totalMiles > 0 ? Math.round((totalExpenses / totalMiles) * 10000) / 10000 : null,
        profit_per_mile: totalMiles > 0 ? Math.round(((totalRevenue - totalExpenses) / totalMiles) * 10000) / 10000 : null,
        deadhead_miles: dailies.reduce((s, d) => s + d.deadhead_miles, 0),
        deadhead_percentage: null,
        fleet_utilization_pct: avgNullable(dailies.map(d => d.fleet_utilization_pct)),
        avg_mpg: avgNullable(dailies.map(d => d.avg_mpg)),
        total_fuel_cost: sumNullable(dailies.map(d => d.total_fuel_cost)),
        total_maintenance_cost: sumNullable(dailies.map(d => d.total_maintenance_cost)),
        vehicles_in_shop: Math.max(...dailies.map(d => d.vehicles_in_shop)),
        compliance_score: avgNullableInt(dailies.map(d => d.compliance_score)),
        overdue_compliance_items: Math.max(...dailies.map(d => d.overdue_compliance_items)),
        active_customers: Math.max(...dailies.map(d => d.active_customers)),
        new_customers: dailies.reduce((s, d) => s + d.new_customers, 0),
        avg_days_to_pay: avgNullable(dailies.map(d => d.avg_days_to_pay)),
        created_at: dailies[0].created_at,
      }
    })
}

function avgNullable(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null)
  if (valid.length === 0) return null
  return Math.round((valid.reduce((s, v) => s + v, 0) / valid.length) * 100) / 100
}

function avgNullableInt(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null)
  if (valid.length === 0) return null
  return Math.round(valid.reduce((s, v) => s + v, 0) / valid.length)
}

function sumNullable(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null)
  if (valid.length === 0) return null
  return valid.reduce((s, v) => s + v, 0)
}
