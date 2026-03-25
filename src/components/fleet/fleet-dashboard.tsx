'use client'

import Link from 'next/link'
import {
  Truck,
  Wrench,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  ChevronRight,
} from 'lucide-react'
import { formatCurrency } from '@/lib/fleet/fleet-helpers'

type StatusCounts = {
  active: number
  in_shop: number
  out_of_service: number
  parked: number
  total: number
}

type CostSummary = {
  fleetCostPerMile: number
  topExpensiveVehicles: {
    vehicleId: string
    unitNumber: string
    totalCost: number
    maintenanceCosts: number
    fuelCosts: number
  }[]
  totalMaintenanceCosts: number
  totalFuelCosts: number
}

type UpcomingItem = {
  id: string
  title: string
  due_date: string | null
  status: string
  vehicles?: { unit_number: string } | null
}

interface FleetDashboardProps {
  statusCounts: StatusCounts
  costSummary: CostSummary
  upcomingMaintenance: UpcomingItem[]
}

export function FleetDashboard({
  statusCounts,
  costSummary,
  upcomingMaintenance,
}: FleetDashboardProps) {
  const totalCosts = costSummary.totalMaintenanceCosts + costSummary.totalFuelCosts
  const maintenancePct = totalCosts > 0
    ? Math.round((costSummary.totalMaintenanceCosts / totalCosts) * 100)
    : 0
  const fuelPct = totalCosts > 0
    ? Math.round((costSummary.totalFuelCosts / totalCosts) * 100)
    : 0

  const overdueCount = upcomingMaintenance.filter((m) => m.status === 'overdue').length
  const dueSoonCount = upcomingMaintenance.filter((m) => m.status === 'due_soon').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Fleet Dashboard</h1>
          <p className="text-gray-500 mt-1">Fleet health and cost overview</p>
        </div>
        <Link
          href="/fleet"
          className="text-sm text-primary hover:text-primary-hover font-medium"
        >
          View All Vehicles
        </Link>
      </div>

      {/* Fleet Snapshot */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link
          href="/fleet?status=active"
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Truck className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{statusCounts.active}</p>
          <p className="text-sm text-gray-500">Active</p>
        </Link>

        <Link
          href="/fleet?status=in_shop"
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{statusCounts.in_shop}</p>
          <p className="text-sm text-gray-500">In Shop</p>
        </Link>

        <Link
          href="/fleet?status=out_of_service"
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{statusCounts.out_of_service}</p>
          <p className="text-sm text-gray-500">Out of Service</p>
        </Link>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
              <Truck className="w-5 h-5 text-gray-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{statusCounts.total}</p>
          <p className="text-sm text-gray-500">Total Fleet</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Maintenance Due */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Maintenance Due</h2>
            <Link
              href="/fleet/maintenance"
              className="text-sm text-primary hover:text-primary-hover flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex items-center gap-4 mb-4">
            {overdueCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                {overdueCount} Overdue
              </span>
            )}
            {dueSoonCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                {dueSoonCount} Due Soon
              </span>
            )}
            {overdueCount === 0 && dueSoonCount === 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                All Clear
              </span>
            )}
          </div>

          {upcomingMaintenance.length === 0 ? (
            <p className="text-sm text-gray-400">No upcoming maintenance items</p>
          ) : (
            <ul className="space-y-3">
              {upcomingMaintenance.slice(0, 5).map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-900">
                      {item.vehicles?.unit_number ?? 'Unknown'}
                    </span>
                    <span className="text-gray-500 ml-2">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        item.status === 'overdue'
                          ? 'bg-red-100 text-red-700'
                          : item.status === 'due_soon'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item.due_date
                        ? new Date(item.due_date).toLocaleDateString()
                        : 'No date'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Cost Per Mile */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fleet Cost Per Mile</h2>
          <p className="text-4xl font-bold text-gray-900 mb-1">
            {formatCurrency(costSummary.fleetCostPerMile)}
          </p>
          <p className="text-sm text-gray-500 mb-6">per mile across active fleet</p>

          {/* Cost breakdown bar */}
          {totalCosts > 0 && (
            <div>
              <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 mb-3">
                <div
                  className="bg-blue-500 transition-all"
                  style={{ width: `${maintenancePct}%` }}
                  title={`Maintenance: ${maintenancePct}%`}
                />
                <div
                  className="bg-amber-500 transition-all"
                  style={{ width: `${fuelPct}%` }}
                  title={`Fuel: ${fuelPct}%`}
                />
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Maintenance ({formatCurrency(costSummary.totalMaintenanceCosts)})
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Fuel ({formatCurrency(costSummary.totalFuelCosts)})
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top 5 Expensive Vehicles */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Top 5 Most Expensive Vehicles
        </h2>
        {costSummary.topExpensiveVehicles.length === 0 ? (
          <p className="text-sm text-gray-400">No cost data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 font-medium">Vehicle</th>
                  <th className="pb-3 font-medium text-right">Maintenance</th>
                  <th className="pb-3 font-medium text-right">Fuel</th>
                  <th className="pb-3 font-medium text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {costSummary.topExpensiveVehicles.map((v) => (
                  <tr key={v.vehicleId} className="hover:bg-gray-50">
                    <td className="py-3">
                      <Link
                        href={`/fleet/${v.vehicleId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {v.unitNumber}
                      </Link>
                    </td>
                    <td className="py-3 text-right text-gray-600">
                      {formatCurrency(v.maintenanceCosts)}
                    </td>
                    <td className="py-3 text-right text-gray-600">
                      {formatCurrency(v.fuelCosts)}
                    </td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      {formatCurrency(v.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
