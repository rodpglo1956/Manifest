'use client'

import type { HealthScoreMetrics } from '@/lib/compliance/compliance-helpers'

interface HealthScoreGaugeProps {
  score: number
  metrics: HealthScoreMetrics
}

function getScoreColor(score: number): { ring: string; text: string; bg: string } {
  if (score >= 80) return { ring: 'stroke-green-500', text: 'text-green-700', bg: 'bg-green-50' }
  if (score >= 50) return { ring: 'stroke-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50' }
  return { ring: 'stroke-red-500', text: 'text-red-700', bg: 'bg-red-50' }
}

export function HealthScoreGauge({ score, metrics }: HealthScoreGaugeProps) {
  const colors = getScoreColor(score)
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className={`rounded-lg border p-6 ${colors.bg}`}>
      <h3 className="text-sm font-medium text-gray-600 mb-4">Compliance Health Score</h3>

      <div className="flex items-center gap-6">
        {/* SVG Ring Gauge */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-200"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={colors.ring}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-3xl font-bold ${colors.text}`}>{score}</span>
          </div>
        </div>

        {/* Metric Breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Overdue Items</span>
            <span className={`font-medium ${metrics.overdueItems > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {metrics.overdueItems}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Due Soon</span>
            <span className={`font-medium ${metrics.dueSoonItems > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {metrics.dueSoonItems}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">DQ Complete</span>
            <span className="font-medium text-gray-900">
              {metrics.driversWithCompleteDQ}/{metrics.totalDrivers}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Inspections Current</span>
            <span className="font-medium text-gray-900">
              {metrics.vehiclesWithCurrentInspection}/{metrics.totalVehicles}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
