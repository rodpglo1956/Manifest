'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  getComplianceItems,
  getDriverQualification,
  getInspections,
  completeComplianceItem,
  upsertIFTARecord,
  getIFTARecords,
} from '@/lib/compliance/actions'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Shield,
  Truck,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  Plus,
  Fuel,
} from 'lucide-react'
import type { ComplianceItem, Inspection, IFTARecord, DriverQualification } from '@/types/database'

interface OOComplianceDashboardProps {
  driverId: string | null
  vehicleIds: string[]
  isDotRegulated: boolean
  hasIftaLicense: boolean
  orgId: string
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function countdownColor(days: number | null): string {
  if (days === null) return 'text-gray-400'
  if (days < 0) return 'text-red-600'
  if (days < 30) return 'text-red-600'
  if (days < 90) return 'text-yellow-600'
  return 'text-green-600'
}

function countdownBg(days: number | null): string {
  if (days === null) return 'bg-gray-50 border-gray-200'
  if (days < 0) return 'bg-red-50 border-red-200'
  if (days < 30) return 'bg-red-50 border-red-200'
  if (days < 90) return 'bg-yellow-50 border-yellow-200'
  return 'bg-green-50 border-green-200'
}

function getCurrentQuarter(): string {
  const now = new Date()
  const q = Math.ceil((now.getMonth() + 1) / 3)
  return `${now.getFullYear()}-Q${q}`
}

const US_JURISDICTIONS = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]

export function OOComplianceDashboard({
  driverId,
  vehicleIds,
  isDotRegulated,
  hasIftaLicense,
  orgId,
}: OOComplianceDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Data state
  const [dq, setDq] = useState<(DriverQualification & { completeness: { percentage: number; missing: string[] } }) | null>(null)
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [items, setItems] = useState<ComplianceItem[]>([])
  const [iftaRecords, setIftaRecords] = useState<IFTARecord[]>([])

  // IFTA form state
  const [showIftaForm, setShowIftaForm] = useState(false)
  const [iftaJurisdiction, setIftaJurisdiction] = useState('')
  const [iftaMiles, setIftaMiles] = useState('')
  const [iftaGallons, setIftaGallons] = useState('')

  useEffect(() => {
    async function load() {
      const promises: Promise<unknown>[] = []

      // DQ file for owner-operator driver
      if (driverId) {
        promises.push(getDriverQualification(driverId).then(setDq))
        promises.push(getComplianceItems({ driverId }).then(setItems))
      } else {
        promises.push(getComplianceItems().then(setItems))
      }

      // Inspections for their vehicles
      if (vehicleIds.length > 0) {
        promises.push(
          getInspections({ vehicleId: vehicleIds[0] }).then(setInspections)
        )
      }

      // IFTA records
      if (hasIftaLicense) {
        promises.push(getIFTARecords().then(setIftaRecords))
      }

      await Promise.all(promises)
      setLoading(false)
    }
    load()
  }, [driverId, vehicleIds, hasIftaLicense])

  function handleCompleteItem(itemId: string) {
    startTransition(async () => {
      await completeComplianceItem(itemId)
      const updated = driverId
        ? await getComplianceItems({ driverId })
        : await getComplianceItems()
      setItems(updated)
    })
  }

  function handleAddIFTA() {
    if (!iftaJurisdiction || !vehicleIds[0]) return
    startTransition(async () => {
      await upsertIFTARecord({
        vehicle_id: vehicleIds[0],
        quarter: getCurrentQuarter(),
        jurisdiction: iftaJurisdiction,
        miles_traveled: parseFloat(iftaMiles) || 0,
        gallons_purchased: parseFloat(iftaGallons) || 0,
      })
      const updated = await getIFTARecords()
      setIftaRecords(updated)
      setShowIftaForm(false)
      setIftaJurisdiction('')
      setIftaMiles('')
      setIftaGallons('')
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  const cdlDays = dq?.cdl_expiry ? daysUntil(dq.cdl_expiry) : null
  const medDays = dq?.medical_card_expiry ? daysUntil(dq.medical_card_expiry) : null

  // Latest inspection for each vehicle
  const latestInspection = inspections.length > 0 ? inspections[0] : null
  const inspectionDays = latestInspection?.expiry_date
    ? daysUntil(latestInspection.expiry_date)
    : null

  // Active (non-completed/waived) items
  const activeItems = items.filter(
    (i) => i.status !== 'completed' && i.status !== 'waived' && i.status !== 'not_applicable'
  )

  // Total IFTA miles and gallons for current quarter
  const totalIftaMiles = iftaRecords.reduce((sum, r) => sum + (r.miles_traveled ?? 0), 0)
  const totalIftaGallons = iftaRecords.reduce((sum, r) => sum + (r.gallons_purchased ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Section 1: Personal DQ File (DOT-regulated only) */}
      {isDotRegulated && dq && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-gray-700">Driver Qualification File</h2>
          </div>

          {/* Completeness bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">DQ File Completeness</span>
              <span className={`text-sm font-semibold ${dq.completeness.percentage === 100 ? 'text-green-600' : 'text-yellow-600'}`}>
                {dq.completeness.percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${dq.completeness.percentage === 100 ? 'bg-green-500' : 'bg-yellow-500'}`}
                style={{ width: `${dq.completeness.percentage}%` }}
              />
            </div>
          </div>

          {/* Missing documents */}
          {dq.completeness.missing.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Missing Documents:</p>
              <div className="flex flex-wrap gap-1">
                {dq.completeness.missing.map((m) => (
                  <span key={m} className="text-xs bg-yellow-100 text-yellow-700 rounded px-1.5 py-0.5">
                    {m.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CDL & Medical countdowns */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-lg border p-3 ${countdownBg(cdlDays)}`}>
              <p className="text-xs text-gray-500 mb-1">CDL Expiry</p>
              {cdlDays !== null ? (
                <>
                  <p className={`text-xl font-bold ${countdownColor(cdlDays)}`}>
                    {cdlDays < 0 ? 'Expired' : `${cdlDays}d`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {cdlDays < 0 ? `${Math.abs(cdlDays)} days ago` : 'remaining'}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400">Not on file</p>
              )}
            </div>
            <div className={`rounded-lg border p-3 ${countdownBg(medDays)}`}>
              <p className="text-xs text-gray-500 mb-1">Medical Card</p>
              {medDays !== null ? (
                <>
                  <p className={`text-xl font-bold ${countdownColor(medDays)}`}>
                    {medDays < 0 ? 'Expired' : `${medDays}d`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {medDays < 0 ? `${Math.abs(medDays)} days ago` : 'remaining'}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400">Not on file</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Vehicle Inspection Tracker */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Truck className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-gray-700">Vehicle Inspections</h2>
        </div>

        {vehicleIds.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">No vehicles registered.</p>
        ) : latestInspection ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900">Last Inspection</p>
                <p className="text-xs text-gray-500">{latestInspection.inspection_date}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={latestInspection.result ?? 'pending'} variant="inspection" />
                {inspectionDays !== null && (
                  <p className={`text-xs mt-1 ${countdownColor(inspectionDays)}`}>
                    {inspectionDays < 0
                      ? `Expired ${Math.abs(inspectionDays)}d ago`
                      : `Expires in ${inspectionDays}d`}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-yellow-600 text-sm py-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>No inspections on record. Schedule your first inspection.</span>
          </div>
        )}
      </div>

      {/* Section 3: Compliance Items */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-gray-700">Compliance Items</h2>
          </div>
          {activeItems.length > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 rounded-full px-2 py-0.5 font-medium">
              {activeItems.length} active
            </span>
          )}
        </div>

        {activeItems.length === 0 ? (
          <div className="flex items-center gap-2 text-green-600 text-sm py-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>All compliance items are up to date.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {activeItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-gray-100 p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={item.status} variant="compliance" />
                    {item.due_date && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.due_date}
                      </span>
                    )}
                  </div>
                </div>
                {item.status !== 'completed' && item.status !== 'waived' && (
                  <button
                    onClick={() => handleCompleteItem(item.id)}
                    disabled={isPending}
                    className="shrink-0 text-xs bg-green-50 text-green-700 border border-green-200 rounded px-2 py-1 hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    Complete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 4: IFTA Log (only if carrier has IFTA license) */}
      {hasIftaLicense && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Fuel className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-gray-700">IFTA Log - {getCurrentQuarter()}</h2>
            </div>
            <button
              onClick={() => setShowIftaForm(!showIftaForm)}
              className="text-xs bg-primary/10 text-primary rounded px-2 py-1 hover:bg-primary/20 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add Entry
            </button>
          </div>

          {/* Quarter summary */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-gray-50 rounded p-2">
              <p className="text-xs text-gray-500">Total Miles</p>
              <p className="text-lg font-semibold text-gray-900">
                {totalIftaMiles.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <p className="text-xs text-gray-500">Total Gallons</p>
              <p className="text-lg font-semibold text-gray-900">
                {totalIftaGallons.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </p>
            </div>
          </div>

          {/* IFTA entry form */}
          {showIftaForm && (
            <div className="border border-gray-200 rounded-lg p-3 mb-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Jurisdiction</label>
                <select
                  value={iftaJurisdiction}
                  onChange={(e) => setIftaJurisdiction(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select state...</option>
                  {US_JURISDICTIONS.map((j) => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Miles</label>
                  <input
                    type="number"
                    value={iftaMiles}
                    onChange={(e) => setIftaMiles(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Gallons</label>
                  <input
                    type="number"
                    value={iftaGallons}
                    onChange={(e) => setIftaGallons(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddIFTA}
                  disabled={isPending || !iftaJurisdiction}
                  className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Save Entry'}
                </button>
                <button
                  onClick={() => setShowIftaForm(false)}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* IFTA records table */}
          {iftaRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-1.5 text-gray-500 font-medium">State</th>
                    <th className="text-right py-1.5 text-gray-500 font-medium">Miles</th>
                    <th className="text-right py-1.5 text-gray-500 font-medium">Gallons</th>
                  </tr>
                </thead>
                <tbody>
                  {iftaRecords.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100">
                      <td className="py-1.5 text-gray-900 font-medium">{r.jurisdiction}</td>
                      <td className="py-1.5 text-gray-700 text-right">
                        {(r.miles_traveled ?? 0).toLocaleString()}
                      </td>
                      <td className="py-1.5 text-gray-700 text-right">
                        {(r.gallons_purchased ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-2">
              No IFTA entries for this quarter yet.
            </p>
          )}
        </div>
      )}

      {/* Non-DOT summary for non-regulated carriers */}
      {!isDotRegulated && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
          <p className="font-medium mb-1">Non-DOT Carrier</p>
          <p>Your compliance tracking covers insurance, registration, and vehicle inspections. DOT-specific items like DQ files and drug testing are not shown.</p>
        </div>
      )}
    </div>
  )
}
