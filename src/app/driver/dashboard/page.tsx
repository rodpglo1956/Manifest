import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DriverDashboardView } from './driver-dashboard-view'
import type { Metadata } from 'next'
import type { Load, Vehicle } from '@/types/database'

export const metadata: Metadata = {
  title: 'Driver Dashboard | Manifest',
}

export default async function DriverDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/driver/login')
  }

  // Get driver record linked to current user
  const { data: driver } = await supabase
    .from('drivers')
    .select('id, org_id')
    .eq('user_id', user.id)
    .single()

  if (!driver) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <p className="text-amber-800 font-medium">
            Your driver profile has not been linked yet
          </p>
          <p className="text-sm text-amber-600 mt-1">
            Please contact your dispatcher to link your account to a driver profile.
          </p>
        </div>
      </div>
    )
  }

  // Query current active dispatch with load data
  const { data: activeDispatch } = await supabase
    .from('dispatches')
    .select('id, load_id, vehicle_id, status')
    .eq('driver_id', driver.id)
    .not('status', 'in', '("completed","rejected")')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let currentLoad: (Load & { vehicle?: Vehicle | null }) | null = null

  if (activeDispatch) {
    const { data: load } = await supabase
      .from('loads')
      .select('*')
      .eq('id', activeDispatch.load_id)
      .single()

    if (load) {
      let vehicle: Vehicle | null = null
      if (activeDispatch.vehicle_id) {
        const { data: v } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', activeDispatch.vehicle_id)
          .single()
        vehicle = v as Vehicle | null
      }
      currentLoad = { ...(load as Load), vehicle }
    }
  }

  // Query next upcoming dispatch (assigned status)
  let nextLoad: {
    load_number: string | null
    pickup_company: string | null
    pickup_date: string | null
    id: string
  } | null = null

  const { data: nextDispatch } = await supabase
    .from('dispatches')
    .select('id, load_id')
    .eq('driver_id', driver.id)
    .eq('status', 'assigned')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (nextDispatch && nextDispatch.load_id !== activeDispatch?.load_id) {
    const { data: load } = await supabase
      .from('loads')
      .select('id, load_number, pickup_company, pickup_date')
      .eq('id', nextDispatch.load_id)
      .single()
    if (load) {
      nextLoad = load
    }
  }

  return (
    <DriverDashboardView
      currentLoad={currentLoad}
      nextLoad={nextLoad}
      driverId={driver.id}
      orgId={driver.org_id}
    />
  )
}
