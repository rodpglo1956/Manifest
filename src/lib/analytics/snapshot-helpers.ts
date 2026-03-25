import type { DailySnapshot } from '@/types/database'

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
