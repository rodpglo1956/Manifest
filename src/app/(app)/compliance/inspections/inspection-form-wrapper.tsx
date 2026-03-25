'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { InspectionForm } from '@/components/compliance/inspection-form'
import type { Vehicle } from '@/types/database'

interface InspectionFormWrapperProps {
  vehicles: Vehicle[]
}

export function InspectionFormWrapper({ vehicles }: InspectionFormWrapperProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover"
        >
          Log Inspection
        </button>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">New Inspection</span>
            <button
              onClick={() => setOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          <InspectionForm
            vehicles={vehicles}
            onSuccess={() => {
              setOpen(false)
              router.refresh()
            }}
          />
        </div>
      )}
    </div>
  )
}
