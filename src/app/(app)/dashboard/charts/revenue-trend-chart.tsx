'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatChartDate, formatCurrency } from '@/lib/analytics/snapshot-helpers'
import type { DailySnapshot } from '@/types/database'

interface RevenueTrendChartProps {
  data: DailySnapshot[]
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  const chartData = data.map((snap) => ({
    date: formatChartDate(snap.snapshot_date),
    revenue: snap.revenue,
  }))

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue Trend (30 Days)</h3>
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
          No analytics data yet. Snapshots are generated nightly.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              tickFormatter={(value: number) => formatCurrency(value)}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#EC008C"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#EC008C' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
