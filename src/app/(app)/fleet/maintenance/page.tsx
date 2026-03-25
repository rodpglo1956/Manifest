import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMaintenanceRecords, getUpcomingMaintenance } from '@/lib/fleet/actions'
import { MaintenanceCenter } from '@/components/fleet/maintenance-center'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Maintenance Center | Manifest',
}

export default async function MaintenancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) redirect('/onboarding')

  // Fetch vehicles for the selector
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, unit_number')
    .eq('org_id', profile.org_id)
    .order('unit_number', { ascending: true })

  // Fetch all maintenance records
  const recordsResult = await getMaintenanceRecords()
  const upcomingResult = await getUpcomingMaintenance()

  return (
    <MaintenanceCenter
      records={recordsResult.data ?? []}
      upcomingItems={upcomingResult.data ?? []}
      vehicles={vehicles ?? []}
    />
  )
}
