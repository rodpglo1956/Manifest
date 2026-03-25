'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts'
import { formatChartDate, formatCurrency } from '@/lib/analytics/snapshot-helpers'

// ---------- Load Volume Chart ----------

interface LoadVolumeData {
  date: string
  completed: number
  canceled: number
}

interface LoadVolumeChartProps {
  data: LoadVolumeData[]
}

export function LoadVolumeChart({ data }: LoadVolumeChartProps) {
  const chartData = data.map((d) => ({ ...d, date: formatChartDate(d.date) }))

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Load Volume</h3>
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
          No load data available for this period.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} />
            <Tooltip
              labelStyle={{ color: '#374151' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Legend />
            <Bar dataKey="completed" name="Completed" fill="#22C55E" radius={[4, 4, 0, 0]} />
            <Bar dataKey="canceled" name="Canceled" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ---------- Miles Trend Chart ----------

interface MilesTrendData {
  date: string
  miles: number
}

interface MilesTrendChartProps {
  data: MilesTrendData[]
}

export function MilesTrendChart({ data }: MilesTrendChartProps) {
  const chartData = data.map((d) => ({ ...d, date: formatChartDate(d.date) }))

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Miles Trending</h3>
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
          No miles data available for this period.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} />
            <Tooltip
              formatter={(value) => [Number(value).toLocaleString(), 'Miles']}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Line
              type="monotone"
              dataKey="miles"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#3B82F6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ---------- On-Time Trend Chart ----------

interface OnTimeTrendData {
  date: string
  onTimePct: number
}

interface OnTimeTrendChartProps {
  data: OnTimeTrendData[]
}

export function OnTimeTrendChart({ data }: OnTimeTrendChartProps) {
  const chartData = data.map((d) => ({ ...d, date: formatChartDate(d.date) }))

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">On-Time Delivery %</h3>
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
          No delivery data available for this period.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(1)}%`, 'On-Time']}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <ReferenceLine
              y={90}
              stroke="#F59E0B"
              strokeDasharray="5 5"
              label={{ value: '90% Target', position: 'insideTopRight', fill: '#F59E0B', fontSize: 11 }}
            />
            <Line
              type="monotone"
              dataKey="onTimePct"
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#8B5CF6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ---------- Rate Per Mile Chart ----------

interface RatePerMileData {
  date: string
  ratePerMile: number
}

interface RatePerMileChartProps {
  data: RatePerMileData[]
}

export function RatePerMileChart({ data }: RatePerMileChartProps) {
  const chartData = data.map((d) => ({ ...d, date: formatChartDate(d.date) }))

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Avg Rate / Mile</h3>
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
          No rate data available for this period.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              tickFormatter={(value: number) => formatCurrency(value)}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value)), 'Rate/Mile']}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Line
              type="monotone"
              dataKey="ratePerMile"
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
