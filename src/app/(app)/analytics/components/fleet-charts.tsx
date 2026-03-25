'use client'

import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatChartDate } from '@/lib/analytics/snapshot-helpers'
import type { AnalyticsSnapshot } from '@/types/database'

// ============================================================
// Fleet Utilization Chart (AreaChart, blue fill)
// ============================================================

interface FleetUtilizationChartProps {
  data: AnalyticsSnapshot[]
}

export function FleetUtilizationChart({ data }: FleetUtilizationChartProps) {
  const chartData = data.map((snap) => ({
    date: formatChartDate(snap.snapshot_date),
    utilization: snap.fleet_utilization_pct ?? 0,
  }))

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Fleet Utilization %</h3>
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
          No fleet data yet. Snapshots are generated nightly.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              tickFormatter={(value: number) => `${value}%`}
              domain={[0, 100]}
            />
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Utilization']}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Area
              type="monotone"
              dataKey="utilization"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ============================================================
// MPG Trend Chart (LineChart)
// ============================================================

interface MpgTrendChartProps {
  data: AnalyticsSnapshot[]
}

export function MpgTrendChart({ data }: MpgTrendChartProps) {
  const chartData = data.map((snap) => ({
    date: formatChartDate(snap.snapshot_date),
    mpg: snap.avg_mpg ?? 0,
  }))

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Average MPG Trend</h3>
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
          No MPG data yet. Snapshots are generated nightly.
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
              tickFormatter={(value: number) => `${value.toFixed(1)}`}
            />
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(1)} MPG`, 'Avg MPG']}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Line
              type="monotone"
              dataKey="mpg"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#10B981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ============================================================
// Maintenance Cost Chart (horizontal BarChart, top 10 vehicles)
// ============================================================

interface MaintenanceCostChartProps {
  data: { unit_number: string; maintenance: number }[]
}

export function MaintenanceCostChart({ data }: MaintenanceCostChartProps) {
  const chartData = data
    .filter((v) => v.maintenance > 0)
    .sort((a, b) => b.maintenance - a.maintenance)
    .slice(0, 10)
    .map((v) => ({
      name: v.unit_number,
      cost: v.maintenance,
    }))

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Maintenance Cost by Vehicle</h3>
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
          No maintenance cost data for this period.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              tickFormatter={(value: number) => `$${value.toLocaleString()}`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              width={55}
            />
            <Tooltip
              formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Maintenance']}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Bar dataKey="cost" fill="#F59E0B" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ============================================================
// Fuel Cost Chart (LineChart, trending)
// ============================================================

interface FuelCostChartProps {
  data: AnalyticsSnapshot[]
}

export function FuelCostChart({ data }: FuelCostChartProps) {
  const chartData = data.map((snap) => ({
    date: formatChartDate(snap.snapshot_date),
    fuel: snap.total_fuel_cost ?? 0,
  }))

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Fuel Cost Trend</h3>
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
          No fuel cost data yet. Snapshots are generated nightly.
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
              tickFormatter={(value: number) => `$${value.toLocaleString()}`}
            />
            <Tooltip
              formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Fuel Cost']}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Line
              type="monotone"
              dataKey="fuel"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#EF4444' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
