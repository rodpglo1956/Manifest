'use client'

import { useState, useTransition } from 'react'
import { StatusBadge } from '@/components/ui/status-badge'
import { DriverFuelForm } from '@/components/fleet/driver-fuel-form'
import {
  VEHICLE_CLASS_LABELS,
  MAINTENANCE_TYPE_LABELS,
  formatCurrency,
} from '@/lib/fleet/fleet-helpers'
import { createMaintenanceRecord } from '@/lib/fleet/actions'
import {
  Wrench, Fuel, DollarSign, TrendingUp, TrendingDown, Minus,
  Plus, ChevronDown, ChevronUp, ClipboardCheck,
} from 'lucide-react'
import Link from 'next/link'
import type {
  Vehicle, MaintenanceRecord, FuelTransaction, VehicleClass, MaintenanceType,
} from '@/types/database'

interface CostBreakdown {
  costPerMile: number
  breakdown: {
    maintenance: number
    fuel: number
    depreciation: number
    insurance: number
    total: number
  }
  totalMiles: number
}

interface OOVehicleDashboardProps {
  vehicle: Vehicle
  driverId: string
  orgId: string
  maintenanceRecords: MaintenanceRecord[]
  fuelTransactions: FuelTransaction[]
  costData: CostBreakdown
  avgMpg: number | null
  previousMonthMpg: number | null
}

export function OOVehicleDashboard({
  vehicle,
  driverId,
  orgId,
  maintenanceRecords,
  fuelTransactions,
  costData,
  avgMpg,
  previousMonthMpg,
}: OOVehicleDashboardProps) {
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false)
  const [showFuelForm, setShowFuelForm] = useState(false)
  const [isMaintPending, startMaintTransition] = useTransition()
  const [maintErrors, setMaintErrors] = useState<string[]>([])
  const [maintSuccess, setMaintSuccess] = useState(false)

  // MPG trend indicator
  const mpgTrend =
    avgMpg !== null && previousMonthMpg !== null
      ? avgMpg > previousMonthMpg
        ? 'up'
        : avgMpg < previousMonthMpg
          ? 'down'
          : 'flat'
      : null

  // Last 12 months maintenance cost
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
  const recentMaintenance = maintenanceRecords.filter(
    (m) => new Date(m.date_in) >= twelveMonthsAgo
  )
  const totalMaintenanceLast12 = recentMaintenance.reduce((sum, m) => sum + m.cost_total, 0)

  // Last 12 months fuel cost
  const recentFuel = fuelTransactions.filter(
    (f) => new Date(f.transaction_date) >= twelveMonthsAgo
  )
  const totalFuelLast12 = recentFuel.reduce((sum, f) => sum + f.total_cost, 0)

  // Monthly average cost
  const monthlyAvgCost =
    costData.breakdown.total > 0
      ? costData.breakdown.total / Math.max(1, vehicle.purchase_date
          ? Math.ceil(
              (Date.now() - new Date(vehicle.purchase_date).getTime()) /
                (1000 * 60 * 60 * 24 * 30)
            )
          : 12)
      : 0

  function handleMaintenanceSubmit(formData: FormData) {
    setMaintErrors([])
    startMaintTransition(async () => {
      const result = await createMaintenanceRecord(formData)
      if (result.error) {
        setMaintErrors(result.error.form)
      } else {
        setMaintSuccess(true)
        setShowMaintenanceForm(false)
        setTimeout(() => setMaintSuccess(false), 3000)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Vehicle Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{vehicle.unit_number}</h2>
            <p className="text-base text-gray-600">
              {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}
            </p>
          </div>
          <StatusBadge status={vehicle.status} variant="vehicle" />
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span>{VEHICLE_CLASS_LABELS[vehicle.vehicle_class as VehicleClass] ?? vehicle.vehicle_class}</span>
          {vehicle.vin && <span>VIN: ...{vehicle.vin.slice(-6)}</span>}
          {vehicle.license_plate && <span>Plate: {vehicle.license_plate}</span>}
          {vehicle.current_odometer !== null && <span>{vehicle.current_odometer.toLocaleString()} mi</span>}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Cost Per Mile"
          value={`$${costData.costPerMile.toFixed(2)}`}
          icon={<DollarSign className="w-5 h-5 text-green-600" />}
        />
        <StatCard
          label="Avg MPG"
          value={avgMpg !== null ? avgMpg.toFixed(1) : '--'}
          icon={<Fuel className="w-5 h-5 text-blue-600" />}
          trend={mpgTrend}
        />
        <StatCard
          label="Maintenance (12mo)"
          value={formatCurrency(totalMaintenanceLast12)}
          icon={<Wrench className="w-5 h-5 text-orange-600" />}
        />
        <StatCard
          label="Fuel (12mo)"
          value={formatCurrency(totalFuelLast12)}
          icon={<Fuel className="w-5 h-5 text-purple-600" />}
        />
      </div>

      {/* Maintenance Log */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Maintenance Log
          </h3>
          <button
            onClick={() => setShowMaintenanceForm(!showMaintenanceForm)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showMaintenanceForm ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showMaintenanceForm ? 'Close' : 'Add Maintenance'}
          </button>
        </div>

        {maintSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
            <p className="text-sm text-green-700">Maintenance record added.</p>
          </div>
        )}

        {showMaintenanceForm && (
          <MaintenanceInlineForm
            vehicleId={vehicle.id}
            onSubmit={handleMaintenanceSubmit}
            isPending={isMaintPending}
            errors={maintErrors}
            onCancel={() => setShowMaintenanceForm(false)}
          />
        )}

        {maintenanceRecords.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No maintenance records yet.</p>
        ) : (
          <div className="space-y-2">
            {maintenanceRecords.slice(0, 10).map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {MAINTENANCE_TYPE_LABELS[record.maintenance_type as MaintenanceType] ?? record.maintenance_type}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(record.date_in).toLocaleDateString()}
                    {record.vendor_name ? ` | ${record.vendor_name}` : ''}
                    {record.downtime_days ? ` | ${record.downtime_days}d downtime` : ''}
                  </p>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(record.cost_total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fuel Tracking */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Fuel className="w-4 h-4" />
            Fuel Tracking
          </h3>
          <button
            onClick={() => setShowFuelForm(!showFuelForm)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showFuelForm ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showFuelForm ? 'Close' : 'Log Fuel'}
          </button>
        </div>

        {/* MPG display */}
        {avgMpg !== null && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
            <span className="text-lg font-bold text-blue-900">{avgMpg.toFixed(1)} MPG</span>
            {mpgTrend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
            {mpgTrend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
            {mpgTrend === 'flat' && <Minus className="w-4 h-4 text-gray-400" />}
            {previousMonthMpg !== null && (
              <span className="text-xs text-blue-700">vs {previousMonthMpg.toFixed(1)} prev month</span>
            )}
          </div>
        )}

        {showFuelForm && (
          <div className="mb-4">
            <DriverFuelForm
              vehicleId={vehicle.id}
              driverId={driverId}
              onClose={() => setShowFuelForm(false)}
            />
          </div>
        )}

        {fuelTransactions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No fuel transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {fuelTransactions.slice(0, 10).map((fuel) => (
              <div
                key={fuel.id}
                className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {fuel.gallons.toFixed(1)} gal
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(fuel.transaction_date).toLocaleDateString()}
                    {fuel.location ? ` | ${fuel.location}` : ''}
                    {fuel.odometer_reading ? ` | ${fuel.odometer_reading.toLocaleString()} mi` : ''}
                  </p>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(fuel.total_cost)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total Cost of Ownership */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4" />
          Total Cost of Ownership
        </h3>

        <div className="text-center mb-4">
          <p className="text-3xl font-bold text-gray-900">
            ${costData.costPerMile.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">cost per mile</p>
        </div>

        <div className="space-y-2 mb-4">
          {vehicle.purchase_price !== null && (
            <CostRow label="Purchase Price" value={vehicle.purchase_price} />
          )}
          <CostRow label="Depreciation" value={costData.breakdown.depreciation} />
          <CostRow label="Total Maintenance" value={costData.breakdown.maintenance} />
          <CostRow label="Total Fuel" value={costData.breakdown.fuel} />
          <CostRow label="Insurance" value={costData.breakdown.insurance} />
          <div className="border-t border-gray-200 pt-2">
            <CostRow label="Total Cost" value={costData.breakdown.total} bold />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-lg font-bold text-gray-900">{formatCurrency(monthlyAvgCost)}</p>
            <p className="text-xs text-gray-500">Monthly Average</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-lg font-bold text-gray-900">{costData.totalMiles.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Total Miles</p>
          </div>
        </div>
      </div>

      {/* Link to DVIR/pre-trip */}
      <Link
        href="/driver/compliance"
        className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50"
      >
        <ClipboardCheck className="w-5 h-5 text-primary" />
        <div>
          <p className="text-sm font-medium text-gray-900">Pre-Trip Inspection</p>
          <p className="text-xs text-gray-500">Complete your DVIR / pre-trip inspection</p>
        </div>
      </Link>
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

function StatCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string
  value: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'flat' | null
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-gray-500">{label}</span></div>
      <div className="flex items-center gap-1">
        <span className="text-lg font-bold text-gray-900">{value}</span>
        {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-green-600" />}
        {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-600" />}
      </div>
    </div>
  )
}

function CostRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-900'}`}>
        {formatCurrency(value)}
      </span>
    </div>
  )
}

function MaintenanceInlineForm({
  vehicleId,
  onSubmit,
  isPending,
  errors,
  onCancel,
}: {
  vehicleId: string
  onSubmit: (formData: FormData) => void
  isPending: boolean
  errors: string[]
  onCancel: () => void
}) {
  const [showMore, setShowMore] = useState(false)

  return (
    <form action={onSubmit} className="space-y-3 p-4 bg-orange-50 rounded-lg border border-orange-200 mb-4">
      <input type="hidden" name="vehicle_id" value={vehicleId} />

      {errors.length > 0 && (
        <div className="p-2 bg-red-50 border border-red-200 rounded">
          {errors.map((e, i) => <p key={i} className="text-sm text-red-700">{e}</p>)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="maint_type" className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
          <select id="maint_type" name="maintenance_type" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="oil_change">Oil Change</option>
            <option value="tire_rotation">Tire Rotation</option>
            <option value="tire_replacement">Tire Replacement</option>
            <option value="brake_service">Brake Service</option>
            <option value="transmission">Transmission</option>
            <option value="engine">Engine</option>
            <option value="electrical">Electrical</option>
            <option value="hvac">HVAC</option>
            <option value="dot_inspection">DOT Inspection</option>
            <option value="preventive">Preventive</option>
            <option value="scheduled_service">Scheduled Service</option>
            <option value="unscheduled_repair">Unscheduled Repair</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="maint_date_in" className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
          <input id="maint_date_in" name="date_in" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <label htmlFor="maint_desc" className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
        <input id="maint_desc" name="description" type="text" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="What was done" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="maint_parts" className="block text-xs font-medium text-gray-700 mb-1">Parts $</label>
          <input id="maint_parts" name="cost_parts" type="number" step="0.01" min="0" defaultValue="0" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="maint_labor" className="block text-xs font-medium text-gray-700 mb-1">Labor $</label>
          <input id="maint_labor" name="cost_labor" type="number" step="0.01" min="0" defaultValue="0" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="maint_total" className="block text-xs font-medium text-gray-700 mb-1">Total $</label>
          <input id="maint_total" name="cost_total" type="number" step="0.01" min="0" defaultValue="0" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <button type="button" onClick={() => setShowMore(!showMore)} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
        {showMore ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {showMore ? 'Less options' : 'More options'}
      </button>

      {showMore && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="maint_vendor" className="block text-xs font-medium text-gray-700 mb-1">Vendor</label>
              <input id="maint_vendor" name="vendor_name" type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="maint_odo" className="block text-xs font-medium text-gray-700 mb-1">Odometer</label>
              <input id="maint_odo" name="odometer_at_service" type="number" min="0" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="maint_date_out" className="block text-xs font-medium text-gray-700 mb-1">Date Out</label>
              <input id="maint_date_out" name="date_out" type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
                <input name="warranty_covered" type="checkbox" value="true" className="rounded" />
                Warranty
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={isPending} className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
          {isPending ? 'Saving...' : 'Add Record'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  )
}
