'use client'

import { useState } from 'react'
import type { Load, LoadStatus, Vehicle } from '@/types/database'
import { VALID_TRANSITIONS, getStatusLabel } from '@/lib/load-status'
import { StatusBadge } from '@/components/ui/status-badge'
import { FileUpload } from '@/components/ui/file-upload'
import { uploadLoadDocument } from '@/lib/storage'
import { driverUpdateStatus, driverUploadDocument } from '@/app/driver/loads/actions'
import { MapPin, Calendar, Truck, Package } from 'lucide-react'

interface DriverActiveLoadProps {
  load: Load & { vehicle?: Vehicle | null }
  orgId: string
}

/**
 * Prominent active load card for Driver PWA.
 * Big, thumb-friendly UI designed for use from a truck cab.
 */
export function DriverActiveLoad({ load, orgId }: DriverActiveLoadProps) {
  const [updating, setUpdating] = useState<LoadStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadingBol, setUploadingBol] = useState(false)
  const [uploadingPod, setUploadingPod] = useState(false)

  // Get valid next transitions (exclude 'canceled' for driver -- admin action only)
  const nextStatuses = VALID_TRANSITIONS[load.status]?.filter(
    (s) => s !== 'canceled'
  ) ?? []

  async function handleStatusUpdate(newStatus: LoadStatus) {
    setUpdating(newStatus)
    setError(null)
    const result = await driverUpdateStatus(load.id, newStatus)
    if (result.error) {
      setError(result.error)
    }
    setUpdating(null)
  }

  async function handleDocUpload(file: File, docType: 'bol' | 'pod') {
    const setUploading = docType === 'bol' ? setUploadingBol : setUploadingPod
    setUploading(true)
    setError(null)

    const { path, error: uploadError } = await uploadLoadDocument(file, orgId, load.id, docType)
    if (uploadError || !path) {
      setError(uploadError || 'Upload failed')
      setUploading(false)
      return
    }

    const result = await driverUploadDocument(load.id, docType, path)
    if (result.error) {
      setError(result.error)
    }
    setUploading(false)
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header with load number and status */}
      <div className="bg-gray-900 text-white px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Active Load</p>
          <p className="text-2xl font-mono font-bold tracking-wide">
            {load.load_number || load.id.slice(0, 8)}
          </p>
        </div>
        <StatusBadge status={load.status} variant="load" />
      </div>

      <div className="p-5 space-y-5">
        {/* Route: Pickup -> Delivery */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-1 w-3 h-3 rounded-full bg-green-500 ring-2 ring-green-200 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Pickup</p>
              <p className="text-lg font-semibold text-gray-900">
                {[load.pickup_city, load.pickup_state].filter(Boolean).join(', ') || 'TBD'}
              </p>
              {(load.pickup_date || load.pickup_time) && (
                <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {load.pickup_date && new Date(load.pickup_date).toLocaleDateString()}
                  {load.pickup_time && ` ${load.pickup_time}`}
                </p>
              )}
            </div>
          </div>

          <div className="ml-1.5 border-l-2 border-dashed border-gray-300 h-4" />

          <div className="flex items-start gap-3">
            <div className="mt-1 w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-200 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Delivery</p>
              <p className="text-lg font-semibold text-gray-900">
                {[load.delivery_city, load.delivery_state].filter(Boolean).join(', ') || 'TBD'}
              </p>
              {(load.delivery_date || load.delivery_time) && (
                <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {load.delivery_date && new Date(load.delivery_date).toLocaleDateString()}
                  {load.delivery_time && ` ${load.delivery_time}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Equipment and vehicle */}
        <div className="flex gap-4 text-sm text-gray-600">
          {load.equipment_type && (
            <span className="flex items-center gap-1.5">
              <Package className="w-4 h-4" />
              {load.equipment_type.replace(/_/g, ' ')}
            </span>
          )}
          {load.vehicle && (load.vehicle as Vehicle).unit_number && (
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4" />
              Unit #{(load.vehicle as Vehicle).unit_number}
            </span>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Status update buttons -- big, thumb-friendly */}
        {nextStatuses.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Update Status
            </p>
            {nextStatuses.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusUpdate(status)}
                disabled={updating !== null}
                className="w-full min-h-[48px] px-6 py-3.5 bg-primary text-white text-lg font-semibold rounded-lg hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating === status ? 'Updating...' : getStatusLabel(status)}
              </button>
            ))}
          </div>
        )}

        {/* Document uploads -- BOL and POD */}
        <div className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Documents
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1.5">BOL</p>
              {load.bol_url ? (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                  <MapPin className="w-4 h-4" />
                  Uploaded
                </div>
              ) : (
                <FileUpload
                  onFileSelected={(file) => handleDocUpload(file, 'bol')}
                  label={uploadingBol ? 'Uploading...' : 'Snap BOL'}
                  isMobile
                  disabled={uploadingBol}
                />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1.5">POD</p>
              {load.pod_url ? (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                  <MapPin className="w-4 h-4" />
                  Uploaded
                </div>
              ) : (
                <FileUpload
                  onFileSelected={(file) => handleDocUpload(file, 'pod')}
                  label={uploadingPod ? 'Uploading...' : 'Snap POD'}
                  isMobile
                  disabled={uploadingPod}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
