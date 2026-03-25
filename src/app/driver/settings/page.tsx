import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Driver, Vehicle } from '@/types/database'
import { DriverSelfProfile } from '@/components/drivers/driver-self-profile'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings | Manifest',
}

export default async function DriverSettingsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get driver record linked to this user
  const { data: driver } = await supabase
    .from('drivers')
    .select('id, org_id, user_id, first_name, last_name, email, phone, license_number, license_state, license_class, license_expiration, hire_date, status, current_vehicle_id, home_terminal, notes, emergency_contact_name, emergency_contact_phone, created_at, updated_at')
    .eq('user_id', user.id)
    .single() as { data: Driver | null }

  if (!driver) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">No Driver Profile</h1>
        <p className="text-gray-500">
          Your account is not linked to a driver profile. Contact your admin.
        </p>
      </div>
    )
  }

  // Fetch assigned vehicle unit number
  let vehicleUnitNumber: string | null = null
  if (driver.current_vehicle_id) {
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('unit_number')
      .eq('id', driver.current_vehicle_id)
      .single() as { data: Pick<Vehicle, 'unit_number'> | null }
    vehicleUnitNumber = vehicle?.unit_number ?? null
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
      <DriverSelfProfile driver={driver} vehicleUnitNumber={vehicleUnitNumber} />
    </div>
  )
}
