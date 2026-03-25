import { describe, it, expect } from 'vitest'
import {
  aggregateWeeklyVolume,
  calculateCurrentMonthOnTime,
  formatChartDate,
  formatCurrency,
} from '@/lib/analytics/snapshot-helpers'
import type { DailySnapshot } from '@/types/database'

function makeSnapshot(overrides: Partial<DailySnapshot> = {}): DailySnapshot {
  return {
    id: 'snap-1',
    org_id: 'org-1',
    snapshot_date: '2026-03-15',
    period: 'daily',
    loads_booked: 5,
    loads_delivered: 3,
    loads_canceled: 0,
    revenue: 15000,
    total_miles: 3000,
    revenue_per_mile: 5.0,
    on_time_deliveries: 3,
    total_deliveries: 3,
    on_time_percentage: 100,
    active_drivers: 4,
    invoices_generated: 2,
    invoices_paid: 1,
    total_expenses: 0,
    net_profit: 15000,
    cost_per_mile: null,
    profit_per_mile: null,
    deadhead_miles: 0,
    deadhead_percentage: null,
    fleet_utilization_pct: null,
    avg_mpg: null,
    total_fuel_cost: null,
    total_maintenance_cost: null,
    vehicles_in_shop: 0,
    compliance_score: null,
    overdue_compliance_items: 0,
    active_customers: 0,
    new_customers: 0,
    avg_days_to_pay: null,
    created_at: '2026-03-15T00:00:00Z',
    ...overrides,
  }
}

describe('aggregateWeeklyVolume', () => {
  it('groups snapshots by ISO week and sums booked + delivered', () => {
    const snapshots = [
      // Week 11 (Mon Mar 9 - Sun Mar 15, 2026)
      makeSnapshot({ snapshot_date: '2026-03-09', loads_booked: 3, loads_delivered: 2 }),
      makeSnapshot({ snapshot_date: '2026-03-10', loads_booked: 4, loads_delivered: 1 }),
      // Week 12 (Mon Mar 16 - Sun Mar 22, 2026)
      makeSnapshot({ snapshot_date: '2026-03-16', loads_booked: 5, loads_delivered: 4 }),
      makeSnapshot({ snapshot_date: '2026-03-17', loads_booked: 2, loads_delivered: 2 }),
      // Week 13 (Mon Mar 23+)
      makeSnapshot({ snapshot_date: '2026-03-23', loads_booked: 6, loads_delivered: 5 }),
    ]

    const result = aggregateWeeklyVolume(snapshots)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ week: 'W11', booked: 7, delivered: 3 })
    expect(result[1]).toEqual({ week: 'W12', booked: 7, delivered: 6 })
    expect(result[2]).toEqual({ week: 'W13', booked: 6, delivered: 5 })
  })

  it('returns empty array for empty input', () => {
    expect(aggregateWeeklyVolume([])).toEqual([])
  })
})

describe('calculateCurrentMonthOnTime', () => {
  it('computes month-to-date on-time percentage from current month snapshots', () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')

    const snapshots = [
      // Current month snapshots
      makeSnapshot({
        snapshot_date: `${year}-${month}-01`,
        on_time_deliveries: 8,
        total_deliveries: 10,
      }),
      makeSnapshot({
        snapshot_date: `${year}-${month}-02`,
        on_time_deliveries: 9,
        total_deliveries: 10,
      }),
      // Previous month snapshot (should be ignored)
      makeSnapshot({
        snapshot_date: '2025-01-15',
        on_time_deliveries: 1,
        total_deliveries: 100,
      }),
    ]

    const result = calculateCurrentMonthOnTime(snapshots)
    // (8+9) / (10+10) * 100 = 85
    expect(result).toBe(85)
  })

  it('returns 0 when no deliveries in current month', () => {
    const snapshots = [
      makeSnapshot({
        snapshot_date: '2025-01-15',
        on_time_deliveries: 5,
        total_deliveries: 5,
      }),
    ]
    expect(calculateCurrentMonthOnTime(snapshots)).toBe(0)
  })
})

describe('formatChartDate', () => {
  it('formats date string to "Mar 15" format', () => {
    expect(formatChartDate('2026-03-15')).toBe('Mar 15')
  })

  it('handles different months', () => {
    expect(formatChartDate('2026-01-05')).toBe('Jan 5')
    expect(formatChartDate('2026-12-25')).toBe('Dec 25')
  })
})

describe('formatCurrency', () => {
  it('formats number as dollar amount', () => {
    expect(formatCurrency(1234)).toBe('$1,234')
    expect(formatCurrency(0)).toBe('$0')
    expect(formatCurrency(1000000)).toBe('$1,000,000')
  })
})
