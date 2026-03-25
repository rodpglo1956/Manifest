'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { checkConflictAction } from './actions'

interface ConflictWarningProps {
  driverId: string
  loadId: string
}

export function ConflictWarning({ driverId, loadId }: ConflictWarningProps) {
  const [conflict, setConflict] = useState<{
    hasConflict: boolean
    conflictingLoads: string[]
  } | null>(null)

  useEffect(() => {
    if (!driverId || !loadId) return

    let cancelled = false

    checkConflictAction(driverId, loadId).then((result) => {
      if (!cancelled) {
        setConflict(result)
      }
    })

    return () => {
      cancelled = true
    }
  }, [driverId, loadId])

  if (!conflict || !conflict.hasConflict) return null

  return (
    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-amber-800">
          Scheduling Conflict Detected
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          Warning: Driver has overlapping loads ({conflict.conflictingLoads.length} conflicting).
          Assigning may cause scheduling conflicts.
        </p>
      </div>
    </div>
  )
}
