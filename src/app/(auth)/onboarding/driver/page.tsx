import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DriverOnboarding } from '@/components/onboarding/driver-onboarding'
import { markDriverOnboarded } from './actions'

export default async function DriverOnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Find the driver record linked to this user
  const { data: driver } = await supabase
    .from('drivers')
    .select('id, first_name, last_name, phone, org_id, current_vehicle_id, is_onboarded')
    .eq('user_id', user.id)
    .single()

  if (!driver) {
    // Not a linked driver -- redirect to login
    redirect('/login')
  }

  // Already onboarded -- go to driver dashboard
  if (driver.is_onboarded) {
    redirect('/driver')
  }

  // Get organization name
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', driver.org_id)
    .single()

  // Get assigned vehicle unit number
  let vehicleUnit: string | null = null
  if (driver.current_vehicle_id) {
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('unit_number')
      .eq('id', driver.current_vehicle_id)
      .single()
    vehicleUnit = vehicle?.unit_number ?? null
  }

  const driverInfo = {
    firstName: driver.first_name,
    lastName: driver.last_name,
    phone: driver.phone,
    vehicleUnit,
    companyName: org?.name ?? 'Your Company',
  }

  return (
    <DriverOnboarding
      driver={driverInfo}
      driverId={driver.id}
      markOnboarded={markDriverOnboarded.bind(null, driver.id)}
    />
  )
}
