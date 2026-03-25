'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { aggregateWeeklyVolume } from '@/lib/analytics/snapshot-helpers'
import type { DailySnapshot } from '@/types/database'

interface LoadVolumeChartProps {
  data: DailySnapshot[]
}

export function LoadVolumeChart({ data }: LoadVolumeChartProps) {
  const chartData = aggregateWeeklyVolume(data)

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Load Volume by Week</h3>
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
          No analytics data yet. Snapshots are generated nightly.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Legend />
            <Bar dataKey="booked" name="Booked" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="delivered" name="Delivered" fill="#EC008C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
