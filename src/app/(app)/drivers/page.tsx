import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DriverList } from '@/components/drivers/driver-list'
import type { Driver } from '@/types/database'

export default async function DriversPage() {
  const supabase = await createClient()

  const { data: drivers } = await supabase
    .from('drivers')
    .select('id, org_id, user_id, first_name, last_name, email, phone, license_number, license_state, license_class, license_expiration, hire_date, status, current_vehicle_id, home_terminal, notes, emergency_contact_name, emergency_contact_phone, created_at, updated_at')
    .order('last_name', { ascending: true }) as { data: Driver[] | null }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Drivers</h1>
        <Link
          href="/drivers/new"
          className="px-4 py-2 bg-primary text-white font-medium rounded-md hover:bg-primary-hover transition-colors"
        >
          Add Driver
        </Link>
      </div>

      <DriverList drivers={drivers ?? []} />
    </div>
  )
}
