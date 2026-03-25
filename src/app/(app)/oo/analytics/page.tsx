import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import type { AnalyticsSnapshot } from '@/types/database'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Fuel,
  Wrench,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Analytics | Manifest',
}

// ============================================================
// Helpers
// ============================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatCurrencyPrecise(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// ============================================================
// OO Analytics Page (Server Component)
// ============================================================

export default async function OOAnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) redirect('/onboarding')

  // Get current month range
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10)
  const today = now.toISOString().slice(0, 10)

  // Previous month range
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  const prevMonthStart = new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), 1)
    .toISOString()
    .slice(0, 10)
  const prevMonthEndStr = prevMonthEnd.toISOString().slice(0, 10)

  // YTD range
  const ytdStart = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10)

  // Fetch current month, previous month, and YTD snapshots
  const [currentRes, previousRes, ytdRes, last3MonthsRes] = await Promise.all([
    supabase
      .from('daily_snapshots')
      .select('*')
      .eq('org_id', profile.org_id)
      .eq('period', 'daily')
      .gte('snapshot_date', currentMonthStart)
      .lte('snapshot_date', today)
      .order('snapshot_date', { ascending: true }),
    supabase
      .from('daily_snapshots')
      .select('*')
      .eq('org_id', profile.org_id)
      .eq('period', 'daily')
      .gte('snapshot_date', prevMonthStart)
      .lte('snapshot_date', prevMonthEndStr)
      .order('snapshot_date', { ascending: true }),
    supabase
      .from('daily_snapshots')
      .select('*')
      .eq('org_id', profile.org_id)
      .eq('period', 'daily')
      .gte('snapshot_date', ytdStart)
      .lte('snapshot_date', today)
      .order('snapshot_date', { ascending: true }),
    supabase
      .from('daily_snapshots')
      .select('snapshot_date, total_fuel_cost, total_maintenance_cost')
      .eq('org_id', profile.org_id)
      .eq('period', 'daily')
      .gte('snapshot_date', new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().slice(0, 10))
      .lte('snapshot_date', today)
      .order('snapshot_date', { ascending: true }),
  ])

  const current = (currentRes.data ?? []) as AnalyticsSnapshot[]
  const previous = (previousRes.data ?? []) as AnalyticsSnapshot[]
  const ytd = (ytdRes.data ?? []) as AnalyticsSnapshot[]

  // Calculate current month metrics
  const income = current.reduce((s, r) => s + r.revenue, 0)
  const fuelCost = current.reduce((s, r) => s + (r.total_fuel_cost ?? 0), 0)
  const maintCost = current.reduce((s, r) => s + (r.total_maintenance_cost ?? 0), 0)
  const expenses = current.reduce((s, r) => s + r.total_expenses, 0)
  const netProfit = income - expenses
  const totalMiles = current.reduce((s, r) => s + r.total_miles, 0)

  // Previous month metrics for change calculation
  const prevIncome = previous.reduce((s, r) => s + r.revenue, 0)
  const prevExpenses = previous.reduce((s, r) => s + r.total_expenses, 0)
  const prevProfit = prevIncome - prevExpenses

  function calcChange(current: number, prev: number): number {
    if (prev === 0) return current > 0 ? 100 : 0
    return Math.round(((current - prev) / prev) * 100)
  }

  // Per-mile profitability
  const rpmValue = totalMiles > 0 ? income / totalMiles : 0
  const cpmValue = totalMiles > 0 ? expenses / totalMiles : 0
  const profitPerMile = totalMiles > 0 ? netProfit / totalMiles : 0

  // YTD tax estimate
  const ytdIncome = ytd.reduce((s, r) => s + r.revenue, 0)
  const ytdFuel = ytd.reduce((s, r) => s + (r.total_fuel_cost ?? 0), 0)
  const ytdMaint = ytd.reduce((s, r) => s + (r.total_maintenance_cost ?? 0), 0)
  const ytdDeductible = ytdFuel + ytdMaint
  const ytdTaxable = ytdIncome - ytdDeductible

  // Last 3 months fuel & maintenance data (aggregated by month)
  const monthlyFuelMaint = new Map<string, { fuel: number; maint: number }>()
  for (const snap of last3MonthsRes.data ?? []) {
    const month = (snap.snapshot_date as string).slice(0, 7)
    const existing = monthlyFuelMaint.get(month) ?? { fuel: 0, maint: 0 }
    existing.fuel += (snap.total_fuel_cost as number | null) ?? 0
    existing.maint += (snap.total_maintenance_cost as number | null) ?? 0
    monthlyFuelMaint.set(month, existing)
  }

  const fuelMaintData = Array.from(monthlyFuelMaint.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, d]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      fuel: Math.round(d.fuel),
      maint: Math.round(d.maint),
    }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

      {/* Section 1: Income vs Expenses */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Income vs Expenses</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            label="Total Income"
            value={formatCurrency(income)}
            change={calcChange(income, prevIncome)}
            icon={<DollarSign className="w-5 h-5" />}
            positive
          />
          <SummaryCard
            label="Total Expenses"
            value={formatCurrency(expenses)}
            change={calcChange(expenses, prevExpenses)}
            icon={<TrendingDown className="w-5 h-5" />}
            positive={false}
          />
          <SummaryCard
            label="Net Profit"
            value={formatCurrency(netProfit)}
            change={calcChange(netProfit, prevProfit)}
            icon={<TrendingUp className="w-5 h-5" />}
            positive={netProfit >= 0}
          />
        </div>
      </div>

      {/* Section 2: Per-Mile Profitability */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Per-Mile Profitability</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPIBlock label="Revenue per Mile" value={formatCurrencyPrecise(rpmValue)} />
          <KPIBlock label="Cost per Mile" value={formatCurrencyPrecise(cpmValue)} />
          <KPIBlock label="Profit per Mile" value={formatCurrencyPrecise(profitPerMile)} highlight={profitPerMile > 0} />
        </div>
      </div>

      {/* Section 3: Year-to-Date Tax Estimate */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Year-to-Date Tax Estimate</h2>
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">YTD Gross Income</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(ytdIncome)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">YTD Deductible Expenses</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(ytdDeductible)}</p>
              <p className="text-xs text-gray-400 mt-1">Fuel + Maintenance</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Estimated Taxable Income</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(ytdTaxable)}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 italic">
            This is an estimate. Consult your tax professional for accurate filing.
          </p>
        </div>
      </div>

      {/* Section 4: Fuel & Maintenance Costs (last 3 months) */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Fuel & Maintenance Costs</h2>
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          {fuelMaintData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No data available yet.</p>
          ) : (
            <div className="space-y-3">
              {fuelMaintData.map((m) => (
                <div key={m.month} className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-12">{m.month}</span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Fuel className="w-3.5 h-3.5 text-blue-500" />
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div
                          className="bg-blue-500 h-3 rounded-full"
                          style={{
                            width: `${Math.min(100, (m.fuel / Math.max(m.fuel, m.maint, 1)) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 w-20 text-right">
                        {formatCurrency(m.fuel)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wrench className="w-3.5 h-3.5 text-orange-500" />
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div
                          className="bg-orange-500 h-3 rounded-full"
                          style={{
                            width: `${Math.min(100, (m.maint / Math.max(m.fuel, m.maint, 1)) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 w-20 text-right">
                        {formatCurrency(m.maint)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Fuel
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> Maintenance
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Inline components
// ============================================================

function SummaryCard({
  label,
  value,
  change,
  icon,
  positive,
}: {
  label: string
  value: string
  change: number
  icon: React.ReactNode
  positive: boolean
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-gray-400">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="mt-1 flex items-center gap-1 text-xs">
        {change !== 0 ? (
          change > 0 ? (
            <>
              <ArrowUp className="w-3 h-3 text-green-600" />
              <span className="text-green-600 font-medium">{Math.abs(change)}%</span>
              <span className="text-gray-400 ml-1">vs last month</span>
            </>
          ) : (
            <>
              <ArrowDown className="w-3 h-3 text-red-600" />
              <span className="text-red-600 font-medium">{Math.abs(change)}%</span>
              <span className="text-gray-400 ml-1">vs last month</span>
            </>
          )
        ) : (
          <span className="text-gray-400">&mdash;</span>
        )}
      </div>
    </div>
  )
}

function KPIBlock({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-green-600' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  )
}
