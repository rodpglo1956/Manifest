'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, ChevronUp, Fuel, Filter } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import { createFuelTransaction } from '@/lib/fleet/actions'
import { formatCurrency } from '@/lib/fleet/fleet-helpers'
import type { FuelTransaction } from '@/types/database'

type VehicleOption = {
  id: string
  unit_number: string
  avg_mpg: number | null
  current_odometer: number | null
}

type DriverOption = {
  id: string
  name: string
}

interface FuelDashboardProps {
  transactions: FuelTransaction[]
  vehicles: VehicleOption[]
  drivers: DriverOption[]
  fleetAvgMpg: number
  totalFuelCosts: number
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr)
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((d.getTime() - jan1.getTime()) / 86400000)
  const week = Math.ceil((dayOfYear + jan1.getDay() + 1) / 7)
  return `W${week}`
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function FuelDashboard({
  transactions,
  vehicles,
  drivers,
  fleetAvgMpg,
  totalFuelCosts,
}: FuelDashboardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const showForm = searchParams.get('addItem') === 'true'

  const [vehicleFilter, setVehicleFilter] = useState<string>('')
  const [isPending, startTransition] = useTransition()

  // Build vehicle lookup
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v.unit_number]))

  // Filter transactions
  const filteredTransactions = vehicleFilter
    ? transactions.filter((t) => t.vehicle_id === vehicleFilter)
    : transactions

  // Last 30 days fuel spend
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const last30DaysSpend = transactions
    .filter((t) => new Date(t.transaction_date) >= thirtyDaysAgo)
    .reduce((sum, t) => sum + t.total_cost, 0)

  // Weekly spend chart data (last 12 weeks)
  const weeklySpend = useMemo(() => {
    const twelveWeeksAgo = new Date(Date.now() - 84 * 24 * 60 * 60 * 1000)
    const recent = transactions.filter(
      (t) => new Date(t.transaction_date) >= twelveWeeksAgo
    )
    const weekMap = new Map<string, number>()
    for (const t of recent) {
      const week = getWeekKey(t.transaction_date)
      weekMap.set(week, (weekMap.get(week) ?? 0) + t.total_cost)
    }
    return Array.from(weekMap.entries())
      .map(([week, spend]) => ({ week, spend: Math.round(spend * 100) / 100 }))
      .sort((a, b) => a.week.localeCompare(b.week))
  }, [transactions])

  // MPG ranking
  const mpgRanking = useMemo(() => {
    return vehicles
      .filter((v) => v.avg_mpg != null && v.avg_mpg > 0)
      .map((v) => {
        const vTx = transactions.filter((t) => t.vehicle_id === v.id)
        const totalGallons = vTx.reduce((sum, t) => sum + t.gallons, 0)
        return {
          id: v.id,
          unitNumber: v.unit_number,
          avgMpg: v.avg_mpg ?? 0,
          totalGallons: Math.round(totalGallons * 100) / 100,
          totalMiles: v.current_odometer ?? 0,
        }
      })
      .sort((a, b) => b.avgMpg - a.avgMpg)
  }, [vehicles, transactions])

  // Monthly cost per mile trending
  const monthlyCpm = useMemo(() => {
    const monthMap = new Map<string, { cost: number; gallons: number }>()
    for (const t of transactions) {
      const month = getMonthKey(t.transaction_date)
      const existing = monthMap.get(month) ?? { cost: 0, gallons: 0 }
      existing.cost += t.total_cost
      existing.gallons += t.gallons
      monthMap.set(month, existing)
    }
    return Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        costPerGallon:
          data.gallons > 0
            ? Math.round((data.cost / data.gallons) * 100) / 100
            : 0,
        totalCost: Math.round(data.cost * 100) / 100,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [transactions])

  function toggleForm() {
    const params = new URLSearchParams(searchParams.toString())
    if (showForm) {
      params.delete('addItem')
    } else {
      params.set('addItem', 'true')
    }
    router.push(`/fleet/fuel?${params.toString()}`, { scroll: false })
  }

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createFuelTransaction(formData)
      if (!result.error) {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('addItem')
        router.push(`/fleet/fuel?${params.toString()}`, { scroll: false })
        router.refresh()
      }
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Fuel Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={toggleForm}
          className="flex items-center gap-2 py-2 px-4 bg-primary text-white font-medium rounded-md hover:bg-primary-hover transition-colors"
        >
          {showForm ? (
            <>
              <ChevronUp className="w-4 h-4" /> Hide Form
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Log Fuel
            </>
          )}
        </button>
      </div>

      {/* Inline Add Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Log Fuel Transaction
          </h2>
          <form action={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle *
              </label>
              <select
                name="vehicle_id"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">Select vehicle...</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.unit_number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Driver
              </label>
              <select
                name="driver_id"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">Select driver...</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                name="transaction_date"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Station name or address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gallons *
              </label>
              <input
                type="number"
                name="gallons"
                required
                min="0.01"
                step="0.01"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price/Gallon
              </label>
              <input
                type="number"
                name="price_per_gallon"
                min="0.01"
                step="0.001"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Cost *
              </label>
              <input
                type="number"
                name="total_cost"
                required
                min="0.01"
                step="0.01"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Odometer
              </label>
              <input
                type="number"
                name="odometer_reading"
                min="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <input type="hidden" name="source" value="manual" />

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={toggleForm}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 text-sm bg-primary text-white font-medium rounded-md hover:bg-primary-hover disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Save Transaction'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fuel Spend & MPG stats */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Fuel Spend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Fuel Spend</h2>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
              <Fuel className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(last30DaysSpend)}
              </p>
              <p className="text-sm text-gray-500">Last 30 days</p>
            </div>
          </div>

          {weeklySpend.length > 0 && (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklySpend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), 'Spend']}
                  />
                  <Bar dataKey="spend" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* MPG Ranking */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">MPG Ranking</h2>
          <p className="text-sm text-gray-500 mb-4">
            Fleet average: <span className="font-medium text-gray-900">{fleetAvgMpg} MPG</span>
          </p>
          {mpgRanking.length === 0 ? (
            <p className="text-sm text-gray-400">No MPG data available</p>
          ) : (
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-2 font-medium">Vehicle</th>
                    <th className="pb-2 font-medium text-right">Avg MPG</th>
                    <th className="pb-2 font-medium text-right">Gallons</th>
                    <th className="pb-2 font-medium text-right">Miles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mpgRanking.map((v, idx) => {
                    const isAboveAvg = v.avgMpg >= fleetAvgMpg
                    const isWorst = idx === mpgRanking.length - 1 && mpgRanking.length > 1
                    return (
                      <tr
                        key={v.id}
                        className={isWorst ? 'bg-red-50' : ''}
                      >
                        <td className="py-2 font-medium text-gray-900">
                          {v.unitNumber}
                        </td>
                        <td
                          className={`py-2 text-right font-medium ${
                            isAboveAvg ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {v.avgMpg}
                        </td>
                        <td className="py-2 text-right text-gray-600">
                          {v.totalGallons.toLocaleString()}
                        </td>
                        <td className="py-2 text-right text-gray-600">
                          {v.totalMiles.toLocaleString()}
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

      {/* Cost Per Gallon Trending */}
      {monthlyCpm.length > 1 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Fuel Cost Trending
          </h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyCpm}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), 'Cost/Gallon']}
                />
                <Line
                  type="monotone"
                  dataKey="costPerGallon"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Fuel Transaction List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Fuel Transactions</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            >
              <option value="">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.unit_number}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium text-right">Gallons</th>
                <th className="px-4 py-3 font-medium text-right">Price/Gal</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium text-right">Odometer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No fuel transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">
                      {new Date(t.transaction_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {vehicleMap.get(t.vehicle_id) ?? 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {t.location ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {t.gallons.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {t.price_per_gallon != null
                        ? `$${t.price_per_gallon.toFixed(3)}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(t.total_cost)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {t.odometer_reading?.toLocaleString() ?? '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
