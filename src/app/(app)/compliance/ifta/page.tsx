import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getIFTARecords } from '@/lib/compliance/actions'
import { IFTATable } from '@/components/compliance/ifta-table'
import type { Metadata } from 'next'
import type { Vehicle } from '@/types/database'

export const metadata: Metadata = {
  title: 'IFTA Quarterly Report | Manifest',
}

function getCurrentQuarter(): string {
  const now = new Date()
  const q = Math.ceil((now.getMonth() + 1) / 3)
  return `${now.getFullYear()}-Q${q}`
}

export default async function IFTAPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const currentQuarter = getCurrentQuarter()
  const records = await getIFTARecords(currentQuarter)

  // Calculate total fleet miles and gallons for the quarter
  const totalFleetMiles = records.reduce((sum, r) => sum + r.miles_traveled, 0)
  const totalFleetGallons = records.reduce((sum, r) => sum + r.gallons_purchased, 0)

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
          <h1 className="text-2xl font-semibold text-gray-900">IFTA Quarterly Report</h1>
          <p className="text-gray-500 mt-1">
            {currentQuarter} -- {records.length} record{records.length !== 1 ? 's' : ''} across jurisdictions
          </p>
        </div>
      </div>

      <IFTATable
        records={records}
        totalFleetMiles={totalFleetMiles}
        totalFleetGallons={totalFleetGallons}
        vehicles={vehicleList}
        currentQuarter={currentQuarter}
      />
    </div>
  )
}
