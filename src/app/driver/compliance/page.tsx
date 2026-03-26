import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DVIRForm } from '@/components/compliance/dvir-form'
import { DriverComplianceView } from '@/components/compliance/driver-compliance-view'
import { ClipboardCheck, AlertTriangle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compliance | Manifest',
}

export default async function DriverCompliancePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get driver record linked to this user
  const { data: driver } = await supabase
    .from('drivers')
    .select('id, first_name, last_name, current_vehicle_id')
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

  // Get assigned vehicle if any
  let vehicle: { id: string; unit_number: string; year: number | null; make: string | null; model: string | null } | null = null
  if (driver.current_vehicle_id) {
    const { data } = await supabase
      .from('vehicles')
      .select('id, unit_number, year, make, model')
      .eq('id', driver.current_vehicle_id)
      .single()
    vehicle = data
  }

  const driverName = `${driver.first_name} ${driver.last_name}`

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-semibold text-gray-900">Compliance</h1>
      </div>

      {/* DVIR Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Vehicle Inspection (DVIR)</h2>
        {vehicle ? (
          <DVIRForm
            vehicleId={vehicle.id}
            vehicleInfo={{
              unit_number: vehicle.unit_number,
              year: vehicle.year,
              make: vehicle.make,
              model: vehicle.model,
            }}
          />
        ) : (
          <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <p className="text-sm">No vehicle assigned -- contact your dispatcher to assign a vehicle.</p>
          </div>
        )}
      </div>

      {/* Personal Compliance Items & DQ Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">My Compliance Status</h2>
        <DriverComplianceView driverId={driver.id} driverName={driverName} />
      </div>
    </div>
  )
}
