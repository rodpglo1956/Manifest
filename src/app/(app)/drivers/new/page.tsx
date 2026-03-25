import Link from 'next/link'
import { DriverForm } from '@/components/drivers/driver-form'
import { createDriver } from '@/app/(app)/drivers/actions'

export default function NewDriverPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/drivers"
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          &larr; Drivers
        </Link>
        <h1 className="text-2xl font-bold">Add Driver</h1>
      </div>

      <DriverForm action={createDriver} submitLabel="Add Driver" />
    </div>
  )
}
