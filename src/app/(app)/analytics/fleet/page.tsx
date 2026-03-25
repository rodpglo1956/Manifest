import { getFleetAnalytics } from '@/lib/analytics/actions'
import {
  FleetUtilizationChart,
  MpgTrendChart,
  MaintenanceCostChart,
  FuelCostChart,
} from '../components/fleet-charts'
import { formatCurrency } from '@/lib/analytics/snapshot-helpers'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fleet Analytics | Manifest',
}

type SearchParams = Promise<{ period?: string }>

export default async function FleetAnalyticsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const period = (['week', 'month', 'quarter'] as const).includes(
    params.period as 'week' | 'month' | 'quarter'
  )
    ? (params.period as 'week' | 'month' | 'quarter')
    : 'month'

  const { error, snapshots, vehicleCosts } = await getFleetAnalytics(period)

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  // Top 10 vehicles by total cost for TCO ranking
  const tcoRanking = vehicleCosts.slice(0, 10)

  // Compute cost per mile (use total_miles from snapshots)
  const totalMiles = snapshots.reduce((s, snap) => s + snap.total_miles, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fleet Analytics</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['week', 'month', 'quarter'] as const).map((p) => (
            <a
              key={p}
              href={`/analytics/fleet?period=${p}`}
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FleetUtilizationChart data={snapshots} />
        <MpgTrendChart data={snapshots} />
        <MaintenanceCostChart data={vehicleCosts} />
        <FuelCostChart data={snapshots} />
      </div>

      {/* Vehicle TCO Ranking Table */}
      <div className="bg-white rounded-lg border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Vehicle TCO Ranking</h3>
        {tcoRanking.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">
            No vehicle cost data for this period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Unit #</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Total Maintenance</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Total Fuel</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Total Cost</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Cost/Mile</th>
                </tr>
              </thead>
              <tbody>
                {tcoRanking.map((v) => {
                  const costPerMile = totalMiles > 0
                    ? (v.total / totalMiles).toFixed(2)
                    : '--'

                  return (
                    <tr key={v.vehicle_id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{v.unit_number}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(v.maintenance)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(v.fuel)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(v.total)}</td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {costPerMile === '--' ? '--' : `$${costPerMile}`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
