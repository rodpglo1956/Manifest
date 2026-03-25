'use client'

import { useRealtimeDispatches } from '@/hooks/use-realtime-dispatches'
import { DriverDispatchCard } from '@/components/drivers/driver-dispatch-card'
import { Navigation } from 'lucide-react'

interface DispatchWithLoad {
  id: string
  org_id: string
  load_id: string
  driver_id: string
  vehicle_id: string | null
  status: string
  assigned_at: string
  accepted_at: string | null
  completed_at: string | null
  estimated_pickup_arrival: string | null
  estimated_delivery_arrival: string | null
  driver_notes: string | null
  dispatcher_notes: string | null
  assigned_by: string | null
  created_at: string
  updated_at: string
  loads: {
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
  } | null
}

interface DriverDispatchClientProps {
  dispatch: DispatchWithLoad | null
  orgId: string
}

export function DriverDispatchClient({ dispatch, orgId }: DriverDispatchClientProps) {
  // Subscribe to real-time dispatch updates
  useRealtimeDispatches(orgId)

  if (!dispatch || !dispatch.loads) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Navigation className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">No Active Dispatch</h2>
        <p className="text-gray-500 text-sm">
          You&apos;ll see new assignments here when dispatched.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DriverDispatchCard dispatch={dispatch} load={dispatch.loads} />
    </div>
  )
}
