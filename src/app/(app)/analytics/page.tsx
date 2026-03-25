import { getAnalyticsDashboard } from '@/lib/analytics/actions'
import { formatCurrency, formatPercent } from '@/lib/analytics/snapshot-helpers'
import { KPICard } from './components/kpi-card'
import { PeriodSelector } from './components/period-selector'
import { RevenueProfitChart } from './components/revenue-profit-chart'
import {
  DollarSign,
  TrendingUp,
  Truck,
  Clock,
  Shield,
  Milestone,
} from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ period?: string }>
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const period = (['week', 'month', 'quarter'] as const).includes(
    params.period as 'week' | 'month' | 'quarter'
  )
    ? (params.period as 'week' | 'month' | 'quarter')
    : 'month'

  const { error, kpis, currentSnapshots } = await getAnalyticsDashboard(period)

  if (error) {
    return (
      <div className="text-center py-12 text-gray-500">
        {error === 'Not authenticated' ? 'Please sign in to view analytics.' : error}
      </div>
    )
  }

  const chartData = currentSnapshots.map((s) => ({
    date: s.snapshot_date,
    revenue: s.revenue,
    expenses: s.total_expenses,
    profit: s.net_profit,
  }))

  // Deadhead percentage from latest snapshot
  const latestSnap = currentSnapshots[currentSnapshots.length - 1]
  const deadheadPct = latestSnap?.deadhead_percentage ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Overview</h2>
        <PeriodSelector />
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis && (
          <>
            <KPICard
              label="Revenue / Mile"
              value={formatCurrency(kpis.rpm.value)}
              change={kpis.rpm.change}
              changePercent={kpis.rpm.changePercent}
              icon={<DollarSign className="w-4 h-4" />}
            />
            <KPICard
              label="Cost / Mile"
              value={formatCurrency(kpis.cpm.value)}
              change={kpis.cpm.change}
              changePercent={kpis.cpm.changePercent}
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <KPICard
              label="Profit / Mile"
              value={formatCurrency(kpis.profitPerMile.value)}
              change={kpis.profitPerMile.change}
              changePercent={kpis.profitPerMile.changePercent}
              icon={<Milestone className="w-4 h-4" />}
            />
            <KPICard
              label="Fleet Utilization"
              value={kpis.fleetUtil.value !== null ? formatPercent(kpis.fleetUtil.value) : 'N/A'}
              change={kpis.fleetUtil.change}
              changePercent={kpis.fleetUtil.changePercent}
              icon={<Truck className="w-4 h-4" />}
            />
            <KPICard
              label="On-Time %"
              value={formatPercent(kpis.onTimePct.value)}
              change={kpis.onTimePct.change}
              changePercent={kpis.onTimePct.changePercent}
              icon={<Clock className="w-4 h-4" />}
            />
            <KPICard
              label="Compliance Score"
              value={
                kpis.complianceScore.value !== null
                  ? `${Math.round(kpis.complianceScore.value)}%`
                  : 'N/A'
              }
              change={kpis.complianceScore.change}
              changePercent={kpis.complianceScore.changePercent}
              icon={<Shield className="w-4 h-4" />}
            />
          </>
        )}
      </div>

      {/* Revenue / Expenses / Profit Chart */}
      <RevenueProfitChart data={chartData} />

      {/* Deadhead stat */}
      <div className="bg-white rounded-lg border border-gray-100 p-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500">Deadhead Percentage</span>
            <div className="text-2xl font-bold text-gray-900">
              {formatPercent(deadheadPct)}
            </div>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-gray-200 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-700">
              {Math.round(deadheadPct)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
