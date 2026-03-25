'use client'

import { useState, useTransition } from 'react'
import { StatusBadge } from '@/components/ui/status-badge'
import { VALID_DISPATCH_TRANSITIONS, getDispatchStatusLabel } from '@/lib/dispatch-status'
import { acceptDispatch, rejectDispatch, updateDriverNotes } from '@/app/driver/dispatch/actions'
import { updateDispatchStatus } from '@/app/(app)/dispatch/actions'
import type { DispatchStatus } from '@/types/database'
import { MapPin, Calendar, Package, MessageSquare, AlertTriangle } from 'lucide-react'

interface DispatchData {
  id: string
  status: string
  driver_notes: string | null
  dispatcher_notes: string | null
}

interface LoadData {
  id: string
  load_number: string | null
  pickup_company: string | null
  pickup_city: string | null
  pickup_state: string | null
  pickup_date: string | null
  delivery_company: string | null
  delivery_city: string | null
  delivery_state: string | null
  delivery_date: string | null
  equipment_type: string | null
  broker_name: string | null
  rate_amount: number | null
  rate_type: string | null
  commodity: string | null
  weight: number | null
}

interface DriverDispatchCardProps {
  dispatch: DispatchData
  load: LoadData
}

/**
 * Prominent dispatch card for Driver PWA.
 * Shows load summary, accept/reject for assigned dispatches,
 * status progression buttons, and notes input.
 */
export function DriverDispatchCard({ dispatch, load }: DriverDispatchCardProps) {
  const [error, setError] = useState<string | null>(null)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [notes, setNotes] = useState(dispatch.driver_notes ?? '')
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  const status = dispatch.status as DispatchStatus
  const isAssigned = status === 'assigned'
  const isTerminal = status === 'completed' || status === 'rejected'

  // Get next valid transitions (exclude rejected -- handled by reject button)
  const nextStatuses = (VALID_DISPATCH_TRANSITIONS[status] ?? []).filter(
    (s) => s !== 'rejected'
  )

  function handleAccept() {
    setPendingAction('accept')
    setError(null)
    startTransition(async () => {
      const result = await acceptDispatch(dispatch.id)
      if (result.error) {
        setError(result.error)
      }
      setPendingAction(null)
    })
  }

  function handleReject() {
    setPendingAction('reject')
    setError(null)
    startTransition(async () => {
      const result = await rejectDispatch(dispatch.id)
      if (result.error) {
        setError(result.error)
      }
      setPendingAction(null)
      setShowRejectConfirm(false)
    })
  }

  function handleStatusUpdate(newStatus: DispatchStatus) {
    setPendingAction(newStatus)
    setError(null)
    startTransition(async () => {
      const result = await updateDispatchStatus(dispatch.id, newStatus)
      if (result.error) {
        setError(result.error)
      }
      setPendingAction(null)
    })
  }

  function handleSendNotes() {
    if (!notes.trim()) return
    setPendingAction('notes')
    setError(null)
    const formData = new FormData()
    formData.append('dispatch_id', dispatch.id)
    formData.append('driver_notes', notes.trim())
    startTransition(async () => {
      const result = await updateDriverNotes(formData)
      if (result.error) {
        setError(result.error)
      }
      setPendingAction(null)
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header with dispatch status */}
      <div className="bg-gray-900 text-white px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Dispatch</p>
          <p className="text-2xl font-mono font-bold tracking-wide">
            {load.load_number || load.id.slice(0, 8)}
          </p>
        </div>
        <StatusBadge status={dispatch.status} variant="dispatch" />
      </div>

      <div className="p-5 space-y-5">
        {/* Load summary: route */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-1 w-3 h-3 rounded-full bg-green-500 ring-2 ring-green-200 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Pickup</p>
              <p className="text-lg font-semibold text-gray-900">
                {load.pickup_company || [load.pickup_city, load.pickup_state].filter(Boolean).join(', ') || 'TBD'}
              </p>
              {load.pickup_company && (load.pickup_city || load.pickup_state) && (
                <p className="text-sm text-gray-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {[load.pickup_city, load.pickup_state].filter(Boolean).join(', ')}
                </p>
              )}
              {load.pickup_date && (
                <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(load.pickup_date).toLocaleDateString()}
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
                {load.delivery_company || [load.delivery_city, load.delivery_state].filter(Boolean).join(', ') || 'TBD'}
              </p>
              {load.delivery_company && (load.delivery_city || load.delivery_state) && (
                <p className="text-sm text-gray-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {[load.delivery_city, load.delivery_state].filter(Boolean).join(', ')}
                </p>
              )}
              {load.delivery_date && (
                <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(load.delivery_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Load details */}
        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
          {load.equipment_type && (
            <span className="flex items-center gap-1.5">
              <Package className="w-4 h-4" />
              {load.equipment_type.replace(/_/g, ' ')}
            </span>
          )}
          {load.commodity && (
            <span className="flex items-center gap-1.5">
              <Package className="w-4 h-4" />
              {load.commodity}
            </span>
          )}
          {load.broker_name && (
            <span className="text-gray-500">
              Broker: {load.broker_name}
            </span>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Accept / Reject buttons for assigned dispatch */}
        {isAssigned && !showRejectConfirm && (
          <div className="space-y-3">
            <button
              onClick={handleAccept}
              disabled={isPending}
              className="w-full min-h-[52px] px-6 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pendingAction === 'accept' ? 'Accepting...' : 'Accept Dispatch'}
            </button>
            <button
              onClick={() => setShowRejectConfirm(true)}
              disabled={isPending}
              className="w-full min-h-[48px] px-6 py-3 bg-red-50 text-red-700 text-base font-medium rounded-lg border border-red-200 hover:bg-red-100 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reject
            </button>
          </div>
        )}

        {/* Reject confirmation */}
        {isAssigned && showRejectConfirm && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">
                Are you sure? This will return the load to unassigned.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={isPending}
                className="flex-1 min-h-[44px] px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pendingAction === 'reject' ? 'Rejecting...' : 'Yes, Reject'}
              </button>
              <button
                onClick={() => setShowRejectConfirm(false)}
                disabled={isPending}
                className="flex-1 min-h-[44px] px-4 py-2.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Status progression buttons */}
        {!isAssigned && !isTerminal && nextStatuses.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Update Status
            </p>
            {nextStatuses.map((nextStatus) => (
              <button
                key={nextStatus}
                onClick={() => handleStatusUpdate(nextStatus)}
                disabled={isPending}
                className="w-full min-h-[48px] px-6 py-3.5 bg-primary text-white text-lg font-semibold rounded-lg hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pendingAction === nextStatus
                  ? 'Updating...'
                  : getDispatchStatusLabel(nextStatus)}
              </button>
            ))}
          </div>
        )}

        {/* Dispatcher notes (read-only) */}
        {dispatch.dispatcher_notes && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <p className="text-xs text-blue-600 uppercase tracking-wide font-medium mb-1">
              From Dispatcher
            </p>
            <p className="text-sm text-blue-900">{dispatch.dispatcher_notes}</p>
          </div>
        )}

        {/* Driver notes section */}
        {!isTerminal && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Notes to Dispatcher
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Type a note to your dispatcher..."
              maxLength={1000}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
            <button
              onClick={handleSendNotes}
              disabled={isPending || !notes.trim()}
              className="w-full min-h-[44px] px-4 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pendingAction === 'notes' ? 'Sending...' : 'Send to Dispatcher'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
