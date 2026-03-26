'use client'

import { useState, useTransition } from 'react'
import { Check, ChevronRight, X, PartyPopper } from 'lucide-react'
import { dismissChecklist } from '@/lib/onboarding/actions'
import type { ChecklistItem } from '@/lib/onboarding/actions'
import Link from 'next/link'

interface GettingStartedChecklistProps {
  items: ChecklistItem[]
}

export function GettingStartedChecklist({ items }: GettingStartedChecklistProps) {
  const [dismissed, setDismissed] = useState(false)
  const [isPending, startTransition] = useTransition()

  const completedCount = items.filter((i) => i.completed).length
  const totalCount = items.length
  const allComplete = completedCount === totalCount

  function handleDismiss() {
    startTransition(async () => {
      const result = await dismissChecklist()
      if (result.success) {
        setDismissed(true)
      }
    })
  }

  if (dismissed) return null

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Getting Started</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {allComplete
              ? 'All tasks complete!'
              : `${completedCount} of ${totalCount} complete`}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          disabled={isPending}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label="Dismiss checklist"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
        <div
          className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
        />
      </div>

      {allComplete ? (
        <div className="text-center py-4">
          <PartyPopper className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">You are all set!</p>
          <p className="text-xs text-gray-500 mt-1">
            Your operation is ready to go.
          </p>
          <button
            onClick={handleDismiss}
            disabled={isPending}
            className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Dismiss
          </button>
        </div>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.label}>
              {item.completed ? (
                <div className="flex items-center gap-3 py-2 px-2 rounded-md text-gray-400">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm line-through">{item.label}</span>
                </div>
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-3 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
