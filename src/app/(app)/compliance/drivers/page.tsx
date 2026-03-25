import { getDriversWithDQStatus, getDriverQualification } from '@/lib/compliance/actions'
import { DQFileTracker } from '@/components/compliance/dq-file-tracker'
import { DQChecklist } from '@/components/compliance/dq-checklist'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Driver Qualification Files | Manifest',
}

export default async function DriversCompliancePage({
  searchParams,
}: {
  searchParams: Promise<{ driverId?: string }>
}) {
  const params = await searchParams
  const driverId = params.driverId

  if (driverId) {
    const drivers = await getDriversWithDQStatus()
    const driver = drivers.find((d) => d.id === driverId)
    const dqData = await getDriverQualification(driverId)

    const driverName = driver
      ? `${driver.first_name} ${driver.last_name}`
      : 'Unknown Driver'

    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/compliance/drivers"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; All Drivers
          </Link>
        </div>
        <DQChecklist
          driverId={driverId}
          driverName={driverName}
          dq={dqData ? { ...dqData } : null}
          completeness={dqData?.completeness ?? { percentage: 0, missing: [
            'application_date', 'cdl_number', 'medical_card_expiry',
            'mvr_last_pulled', 'road_test_date', 'annual_review_date',
            'drug_test_last_date', 'hire_date',
          ]}}
        />
      </div>
    )
  }

  const drivers = await getDriversWithDQStatus()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Driver Qualification Files</h1>
          <p className="text-gray-500 mt-1">
            {drivers.length} active driver{drivers.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
      </div>

      <DQFileTracker drivers={drivers} />
    </div>
  )
}
