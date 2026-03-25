'use client'

import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts'

interface OnTimeGaugeProps {
  percentage: number
}

function getGaugeColor(value: number): string {
  if (value >= 90) return '#22c55e' // green
  if (value >= 70) return '#eab308' // yellow
  return '#ef4444' // red
}

export function OnTimeGauge({ percentage }: OnTimeGaugeProps) {
  const color = getGaugeColor(percentage)
  const data = [{ value: percentage, fill: color }]

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">On-Time Performance</h3>
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <RadialBarChart
            cx="50%"
            cy="80%"
            innerRadius={60}
            outerRadius={80}
            barSize={12}
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              dataKey="value"
              cornerRadius={6}
              background={{ fill: '#f3f4f6' }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-8">
          <span className="text-3xl font-bold" style={{ color }} data-testid="gauge-percentage">
            {percentage}%
          </span>
          <span className="text-xs text-gray-500 mt-1">On-Time This Month</span>
        </div>
      </div>
    </div>
  )
}
