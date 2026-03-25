import { getOperationsAnalytics } from '@/lib/analytics/actions'
import { formatCurrency } from '@/lib/analytics/snapshot-helpers'
import { PeriodSelector } from '../components/period-selector'
import {
  LoadVolumeChart,
  MilesTrendChart,
  OnTimeTrendChart,
  RatePerMileChart,
} from '../components/operations-charts'

interface PageProps {
  searchParams: Promise<{ period?: string }>
}

export default async function OperationsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const period = (['week', 'month', 'quarter'] as const).includes(
    params.period as 'week' | 'month' | 'quarter'
  )
    ? (params.period as 'week' | 'month' | 'quarter')
    : 'month'

  const { error, snapshots, topLanes } = await getOperationsAnalytics(period)

  if (error) {
    return (
      <div className="text-center py-12 text-gray-500">
        {error === 'Not authenticated' ? 'Please sign in to view analytics.' : error}
      </div>
    )
  }

  const loadVolumeData = snapshots.map((s) => ({
    date: s.snapshot_date,
    completed: s.loads_delivered,
    canceled: s.loads_canceled,
  }))

  const milesData = snapshots.map((s) => ({
    date: s.snapshot_date,
    miles: s.total_miles,
  }))

  const onTimeData = snapshots.map((s) => ({
    date: s.snapshot_date,
    onTimePct: s.on_time_percentage,
  }))

  const ratePerMileData = snapshots
    .filter((s) => s.revenue_per_mile > 0)
    .map((s) => ({
      date: s.snapshot_date,
      ratePerMile: s.revenue_per_mile,
    }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Operations</h2>
        <PeriodSelector />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LoadVolumeChart data={loadVolumeData} />
        <MilesTrendChart data={milesData} />
        <OnTimeTrendChart data={onTimeData} />
        <RatePerMileChart data={ratePerMileData} />
      </div>

      {/* Top Lanes Table */}
      <div className="bg-white rounded-lg border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Lanes by Revenue</h3>
        {topLanes.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No lane data available for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">#</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Origin</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Destination</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Loads</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Revenue</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Avg Rate/Mile</th>
                </tr>
              </thead>
              <tbody>
                {topLanes.map((lane, idx) => {
                  const avgRate = lane.loads > 0 ? lane.revenue / lane.loads : 0
                  return (
                    <tr
                      key={`${lane.origin}-${lane.destination}`}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-2 px-3 text-gray-400">{idx + 1}</td>
                      <td className="py-2 px-3 text-gray-900">{lane.origin}</td>
                      <td className="py-2 px-3 text-gray-900">{lane.destination}</td>
                      <td className="py-2 px-3 text-right text-gray-900">{lane.loads}</td>
                      <td className="py-2 px-3 text-right text-gray-900 font-medium">
                        {formatCurrency(lane.revenue)}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        {formatCurrency(Math.round(avgRate))}
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
