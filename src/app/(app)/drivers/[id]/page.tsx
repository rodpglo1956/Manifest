import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DriverDetail } from '@/components/drivers/driver-detail'
import type { Driver, Vehicle, Load } from '@/types/database'

interface DriverPageProps {
  params: Promise<{ id: string }>
}

export default async function DriverPage({ params }: DriverPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: driver } = await supabase
    .from('drivers')
    .select('id, org_id, user_id, first_name, last_name, email, phone, license_number, license_state, license_class, license_expiration, hire_date, status, current_vehicle_id, home_terminal, notes, emergency_contact_name, emergency_contact_phone, created_at, updated_at')
    .eq('id', id)
    .single() as { data: Driver | null }

  if (!driver) {
    notFound()
  }

  // Fetch assigned vehicle if exists
  let vehicle: Vehicle | null = null
  if (driver.current_vehicle_id) {
    const { data } = await supabase
      .from('vehicles')
      .select('id, org_id, unit_number, vin, year, make, model, vehicle_type, status, created_at, updated_at')
      .eq('id', driver.current_vehicle_id)
      .single() as { data: Vehicle | null }
    vehicle = data
  }

  // Fetch recent loads (last 10)
  const { data: recentLoads } = await supabase
    .from('loads')
    .select('id, org_id, load_number, status, pickup_city, pickup_state, delivery_city, delivery_state, pickup_date, delivery_date, rate_amount, total_charges, driver_id, vehicle_id, created_at, updated_at')
    .eq('driver_id', id)
    .order('created_at', { ascending: false })
    .limit(10) as { data: Load[] | null }

  return (
    <div className="space-y-4">
      <Link
        href="/drivers"
        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        &larr; Back to Drivers
      </Link>

      <DriverDetail
        driver={driver}
        vehicle={vehicle}
        recentLoads={(recentLoads as Load[]) ?? []}
      />
    </div>
  )
}
