import { getDriverPerformance } from '@/lib/analytics/actions'
import { DriverScorecard } from '../components/driver-scorecard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Driver Performance | Manifest',
}

type SearchParams = Promise<{ period?: string }>

export default async function DriversAnalyticsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const period = (['month', 'quarter', 'year'] as const).includes(
    params.period as 'month' | 'quarter' | 'year'
  )
    ? (params.period as 'month' | 'quarter' | 'year')
    : 'month'

  const { error, drivers } = await getDriverPerformance(period)

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  // Summary stats
  const totalDrivers = drivers.length
  const avgOnTime =
    drivers.length > 0
      ? drivers.reduce((s, d) => s + (d.on_time_pct ?? 0), 0) / drivers.length
      : 0
  const avgCompliance =
    drivers.length > 0
      ? drivers.reduce((s, d) => s + (d.compliance_score ?? 0), 0) / drivers.length
      : 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Driver Performance</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['month', 'quarter', 'year'] as const).map((p) => (
            <a
              key={p}
              href={`/analytics/drivers?period=${p}`}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                period === p
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </a>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Drivers</p>
          <p className="text-2xl font-bold text-gray-900">{totalDrivers}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Avg On-Time %</p>
          <p className="text-2xl font-bold text-gray-900">{avgOnTime.toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Avg Compliance Score</p>
          <p className="text-2xl font-bold text-gray-900">{Math.round(avgCompliance)}%</p>
        </div>
      </div>

      {/* Scorecard Table */}
      <DriverScorecard drivers={drivers} />
    </div>
  )
}
