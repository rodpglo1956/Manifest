import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DriverDispatchClient } from './client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dispatch | Manifest',
}

export default async function DriverDispatchPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get driver record linked to this user
  const { data: driver } = await supabase
    .from('drivers')
    .select('id, org_id')
    .eq('user_id', user.id)
    .single()

  if (!driver) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">No Driver Profile</h1>
        <p className="text-gray-500">Your account is not linked to a driver profile. Contact your admin.</p>
      </div>
    )
  }

  // Query current dispatch: active (not completed/rejected), most recent first
  const { data: dispatch } = await supabase
    .from('dispatches')
    .select(`
      id,
      org_id,
      load_id,
      driver_id,
      vehicle_id,
      status,
      assigned_at,
      accepted_at,
      completed_at,
      estimated_pickup_arrival,
      estimated_delivery_arrival,
      driver_notes,
      dispatcher_notes,
      assigned_by,
      created_at,
      updated_at,
      loads (
        id,
        load_number,
        pickup_company,
        pickup_city,
        pickup_state,
        pickup_date,
        delivery_company,
        delivery_city,
        delivery_state,
        delivery_date,
        equipment_type,
        broker_name,
        rate_amount,
        rate_type,
        commodity,
        weight
      )
    `)
    .eq('driver_id', driver.id)
    .not('status', 'in', '("completed","rejected")')
    .order('assigned_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <DriverDispatchClient
      dispatch={dispatch}
      orgId={driver.org_id}
    />
  )
}
