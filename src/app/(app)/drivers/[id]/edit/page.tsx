import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DriverForm } from '@/components/drivers/driver-form'
import { updateDriver } from '@/app/(app)/drivers/actions'
import type { Driver } from '@/types/database'

interface EditDriverPageProps {
  params: Promise<{ id: string }>
}

export default async function EditDriverPage({ params }: EditDriverPageProps) {
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

  const boundUpdateDriver = updateDriver.bind(null, id)

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/drivers/${id}`}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          &larr; {driver.first_name} {driver.last_name}
        </Link>
        <h1 className="text-2xl font-bold">Edit Driver</h1>
      </div>

      <DriverForm
        defaultValues={{
          first_name: driver.first_name,
          last_name: driver.last_name,
          email: driver.email ?? '',
          phone: driver.phone ?? '',
          license_number: driver.license_number ?? '',
          license_state: driver.license_state ?? '',
          license_class: driver.license_class ?? undefined,
          license_expiration: driver.license_expiration ?? '',
          hire_date: driver.hire_date ?? '',
          status: driver.status,
          home_terminal: driver.home_terminal ?? '',
          notes: driver.notes ?? '',
          emergency_contact_name: driver.emergency_contact_name ?? '',
          emergency_contact_phone: driver.emergency_contact_phone ?? '',
        }}
        action={boundUpdateDriver}
        submitLabel="Update Driver"
        showStatus
      />
    </div>
  )
}
