import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Vehicle } from '@/types/database'
import { StatusBadge } from '@/components/ui/status-badge'
import { VEHICLE_CLASS_LABELS, MAINTENANCE_TYPE_LABELS, formatCurrency } from '@/lib/fleet/fleet-helpers'
import {
  getMaintenanceRecords,
  getFuelTransactions,
  getVehicleCostPerMile,
  getVehicleAssignmentHistory,
} from '@/lib/fleet/actions'

export const metadata: Metadata = {
  title: 'Vehicle Detail | Manifest',
}

const FUEL_TYPE_LABELS: Record<string, string> = {
  diesel: 'Diesel',
  gasoline: 'Gasoline',
  cng: 'CNG',
  electric: 'Electric',
  hybrid: 'Hybrid',
}

type TabKey = 'maintenance' | 'fuel' | 'costs' | 'history'

interface VehicleDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function VehicleDetailPage({ params, searchParams }: VehicleDetailPageProps) {
  const { id } = await params
  const { tab: rawTab } = await searchParams
  const tab: TabKey = ['maintenance', 'fuel', 'costs', 'history'].includes(rawTab ?? '')
    ? (rawTab as TabKey)
    : 'maintenance'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single() as { data: Vehicle | null }

  if (!vehicle) notFound()

  // Fetch driver name if assigned
  let driverName: string | null = null
  if (vehicle.current_driver_id) {
    const { data: driver } = await supabase
      .from('drivers')
      .select('first_name, last_name')
      .eq('id', vehicle.current_driver_id)
      .single()
    if (driver) {
      driverName = `${driver.first_name} ${driver.last_name}`
    }
  }

  // Fetch tab data
  const [maintenanceRecords, fuelTransactions, costData, assignmentHistory] = await Promise.all([
    getMaintenanceRecords(id, 20),
    getFuelTransactions(id, 20),
    getVehicleCostPerMile(id),
    getVehicleAssignmentHistory(id),
  ])

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'maintenance', label: 'Maintenance', count: maintenanceRecords.length },
    { key: 'fuel', label: 'Fuel', count: fuelTransactions.length },
    { key: 'costs', label: 'Costs' },
    { key: 'history', label: 'History', count: assignmentHistory.length },
  ]

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link href="/fleet" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
          &larr; Back to Fleet
        </Link>
      </div>

      {/* Vehicle Info Card */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            {/* Photo placeholder */}
            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-2xl shrink-0">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-semibold text-gray-900">{vehicle.unit_number}</h1>
                <StatusBadge status={vehicle.status} variant="vehicle" />
              </div>
              <p className="text-gray-600">
                {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'Unknown vehicle'}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-gray-500">
                <span>Class: {VEHICLE_CLASS_LABELS[vehicle.vehicle_class] ?? 'Other'}</span>
                <span>Fuel: {FUEL_TYPE_LABELS[vehicle.fuel_type ?? 'diesel'] ?? vehicle.fuel_type}</span>
                {vehicle.vin && <span className="font-mono text-xs">VIN: {vehicle.vin}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Key details grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Driver</p>
            <p className="text-sm text-gray-900 mt-0.5">
              {driverName ? (
                <Link href={`/drivers/${vehicle.current_driver_id}`} className="text-primary hover:underline">
                  {driverName}
                </Link>
              ) : (
                <span className="text-gray-400">Unassigned</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">License Plate</p>
            <p className="text-sm text-gray-900 mt-0.5">
              {vehicle.license_plate ? `${vehicle.license_plate} (${vehicle.license_state ?? ''})` : '--'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Reg Expiry</p>
            <p className="text-sm text-gray-900 mt-0.5">{vehicle.registration_expiry ?? '--'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Odometer</p>
            <p className="text-sm text-gray-900 mt-0.5">
              {vehicle.current_odometer != null
                ? `${vehicle.current_odometer.toLocaleString()} mi`
                : '--'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link href={`/fleet/${id}/edit`} className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary-hover transition-colors">
          Edit Vehicle
        </Link>
        <Link href={`/fleet/${id}/edit`} className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
          Change Status
        </Link>
      </div>

      {/* Tabs */}
      <div>
        <div className="border-b border-gray-200">
          <nav className="flex gap-0 -mb-px">
            {tabs.map((t) => (
              <Link
                key={t.key}
                href={`/fleet/${id}?tab=${t.key}`}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t.label}
                {t.count !== undefined && (
                  <span className="ml-1.5 text-xs text-gray-400">({t.count})</span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {tab === 'maintenance' && (
            <MaintenanceTab records={maintenanceRecords} vehicleId={id} />
          )}
          {tab === 'fuel' && (
            <FuelTab transactions={fuelTransactions} avgMpg={costData.avgMpg} vehicleId={id} />
          )}
          {tab === 'costs' && (
            <CostsTab data={costData} />
          )}
          {tab === 'history' && (
            <HistoryTab assignments={assignmentHistory} />
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Maintenance Tab
// ============================================================

function MaintenanceTab({
  records,
  vehicleId,
}: {
  records: Awaited<ReturnType<typeof getMaintenanceRecords>>
  vehicleId: string
}) {
  if (records.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-8 text-center">
        <p className="text-gray-500">No maintenance records yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Description</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Vendor</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">Cost</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Date In</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Date Out</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">Downtime</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                    {MAINTENANCE_TYPE_LABELS[r.maintenance_type as keyof typeof MAINTENANCE_TYPE_LABELS] ?? r.maintenance_type}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-700 max-w-xs truncate">{r.description}</td>
                <td className="py-3 px-4 text-gray-600">{r.vendor_name ?? '--'}</td>
                <td className="py-3 px-4 text-right font-medium">{r.cost_total != null ? formatCurrency(Number(r.cost_total)) : '--'}</td>
                <td className="py-3 px-4 text-gray-600">{r.date_in}</td>
                <td className="py-3 px-4 text-gray-600">{r.date_out ?? '--'}</td>
                <td className="py-3 px-4 text-right text-gray-600">
                  {r.downtime_days != null ? `${r.downtime_days}d` : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================
// Fuel Tab
// ============================================================

function FuelTab({
  transactions,
  avgMpg,
  vehicleId,
}: {
  transactions: Awaited<ReturnType<typeof getFuelTransactions>>
  avgMpg: number
  vehicleId: string
}) {
  return (
    <div className="space-y-4">
      {/* MPG display */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Average MPG</p>
            <p className="text-2xl font-semibold text-gray-900">
              {avgMpg > 0 ? avgMpg.toFixed(1) : '--'}
            </p>
          </div>
          <p className="text-sm text-gray-500">Based on {transactions.length} fuel records</p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-8 text-center">
          <p className="text-gray-500">No fuel transactions yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Location</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Gallons</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Cost</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Odometer</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((ft) => (
                  <tr key={ft.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-700">{ft.transaction_date}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {[ft.location, ft.city, ft.state].filter(Boolean).join(', ') || '--'}
                    </td>
                    <td className="py-3 px-4 text-right">{Number(ft.gallons).toFixed(1)}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(Number(ft.total_cost))}</td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {ft.odometer_reading ? ft.odometer_reading.toLocaleString() : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Costs Tab
// ============================================================

function CostsTab({ data }: { data: Awaited<ReturnType<typeof getVehicleCostPerMile>> }) {
  const items = [
    { label: 'Maintenance', value: data.maintenanceCost },
    { label: 'Fuel', value: data.fuelCost },
  ]

  const totalCost = data.maintenanceCost + data.fuelCost

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Cost per mile card */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase mb-1">Cost per Mile</h3>
        <p className="text-3xl font-semibold text-gray-900">
          {data.costPerMile > 0 ? `$${data.costPerMile.toFixed(2)}` : '--'}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {data.totalMiles > 0 ? `Based on ${data.totalMiles.toLocaleString()} miles` : 'No mileage data available'}
        </p>
      </div>

      {/* Total cost card */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase mb-1">Total Costs</h3>
        <p className="text-3xl font-semibold text-gray-900">{formatCurrency(totalCost)}</p>
        <p className="text-sm text-gray-500 mt-1">Maintenance + Fuel</p>
      </div>

      {/* Breakdown */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 md:col-span-2">
        <h3 className="text-sm font-medium text-gray-500 uppercase mb-4">Cost Breakdown</h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{item.label}</span>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: totalCost > 0 ? `${(item.value / totalCost) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-24 text-right">
                  {formatCurrency(item.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// History Tab
// ============================================================

function HistoryTab({
  assignments,
}: {
  assignments: Awaited<ReturnType<typeof getVehicleAssignmentHistory>>
}) {
  if (assignments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-8 text-center">
        <p className="text-gray-500">No assignment history yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-200" />

        <div className="space-y-6">
          {assignments.map((a, i) => (
            <div key={a.id} className="relative pl-8">
              {/* Dot */}
              <div
                className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 ${
                  a.unassigned_at
                    ? 'bg-white border-gray-300'
                    : 'bg-primary border-primary'
                }`}
              />

              <div>
                <p className="text-sm font-medium text-gray-900">
                  {a.driver_name ?? 'Unknown Driver'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Assigned: {new Date(a.assigned_at).toLocaleDateString()}
                  {a.unassigned_at && (
                    <> &mdash; Unassigned: {new Date(a.unassigned_at).toLocaleDateString()}</>
                  )}
                  {!a.unassigned_at && (
                    <span className="ml-2 text-green-600 font-medium">Current</span>
                  )}
                </p>
                {a.reason && (
                  <p className="text-xs text-gray-400 mt-0.5">Reason: {a.reason}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
