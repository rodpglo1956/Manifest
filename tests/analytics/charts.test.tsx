import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RevenueTrendChart } from '@/app/(app)/dashboard/charts/revenue-trend-chart'
import { OnTimeGauge } from '@/app/(app)/dashboard/charts/on-time-gauge'
import { LoadVolumeChart } from '@/app/(app)/dashboard/charts/load-volume-chart'
import { RpmTrendChart } from '@/app/(app)/dashboard/charts/rpm-trend-chart'
import type { DailySnapshot } from '@/types/database'

// Mock recharts ResponsiveContainer since it needs DOM measurements
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      <div style={{ width: 500, height: 300 }}>{children}</div>,
  }
})

function makeSnapshot(overrides: Partial<DailySnapshot> = {}): DailySnapshot {
  return {
    id: 'snap-1',
    org_id: 'org-1',
    snapshot_date: '2026-03-15',
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
    created_at: '2026-03-15T00:00:00Z',
    ...overrides,
  }
}

const mockData: DailySnapshot[] = [
  makeSnapshot({ snapshot_date: '2026-03-10', revenue: 10000, revenue_per_mile: 4.5 }),
  makeSnapshot({ snapshot_date: '2026-03-11', revenue: 12000, revenue_per_mile: 5.0 }),
  makeSnapshot({ snapshot_date: '2026-03-12', revenue: 11000, revenue_per_mile: 4.8 }),
]

describe('RevenueTrendChart', () => {
  it('renders without crashing with mock data', () => {
    const { container } = render(<RevenueTrendChart data={mockData} />)
    expect(container).toBeTruthy()
    expect(screen.getByText('Revenue Trend (30 Days)')).toBeTruthy()
  })

  it('shows empty state message with no data', () => {
    render(<RevenueTrendChart data={[]} />)
    expect(screen.getByText(/No analytics data yet/)).toBeTruthy()
  })
})

describe('OnTimeGauge', () => {
  it('renders correct percentage text', () => {
    render(<OnTimeGauge percentage={85} />)
    expect(screen.getByTestId('gauge-percentage').textContent).toBe('85%')
  })

  it('renders 0% without crashing', () => {
    render(<OnTimeGauge percentage={0} />)
    expect(screen.getByTestId('gauge-percentage').textContent).toBe('0%')
  })
})

describe('LoadVolumeChart', () => {
  it('renders without crashing with mock data', () => {
    const { container } = render(<LoadVolumeChart data={mockData} />)
    expect(container).toBeTruthy()
    expect(screen.getByText('Load Volume by Week')).toBeTruthy()
  })

  it('shows empty state with no data', () => {
    render(<LoadVolumeChart data={[]} />)
    expect(screen.getByText(/No analytics data yet/)).toBeTruthy()
  })
})

describe('RpmTrendChart', () => {
  it('renders without crashing with mock data', () => {
    const { container } = render(<RpmTrendChart data={mockData} />)
    expect(container).toBeTruthy()
    expect(screen.getByText('Revenue Per Mile (30 Days)')).toBeTruthy()
  })

  it('shows empty state with no data', () => {
    render(<RpmTrendChart data={[]} />)
    expect(screen.getByText(/No analytics data yet/)).toBeTruthy()
  })
})
