import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getInspections } from '@/lib/compliance/actions'
import { InspectionLog } from '@/components/compliance/inspection-log'
import { InspectionFormWrapper } from './inspection-form-wrapper'
import type { Metadata } from 'next'
import type { Vehicle } from '@/types/database'

export const metadata: Metadata = {
  title: 'Inspections | Manifest',
}

export default async function InspectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const inspections = await getInspections()

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('status', 'active')
    .order('unit_number')

  const vehicleList = (vehicles ?? []) as Vehicle[]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inspection Log</h1>
          <p className="text-gray-500 mt-1">
            {inspections.length} inspection{inspections.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
      </div>

      <InspectionFormWrapper vehicles={vehicleList} />

      <div className="mt-6">
        <InspectionLog inspections={inspections} vehicles={vehicleList} />
      </div>
    </div>
  )
}
