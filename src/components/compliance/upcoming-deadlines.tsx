'use client'

import Link from 'next/link'
import { StatusBadge } from '@/components/ui/status-badge'
import type { ComplianceItem } from '@/types/database'

interface UpcomingDeadlinesProps {
  items: ComplianceItem[]
}

function formatCategory(category: string): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function getDaysRemaining(dueDate: string | null): number | null {
  if (!dueDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate + 'T00:00:00')
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

function getRowUrgencyClass(daysRemaining: number | null, status: string): string {
  if (status === 'overdue' || (daysRemaining !== null && daysRemaining < 0)) {
    return 'bg-red-50 border-l-4 border-l-red-400'
  }
  if (daysRemaining !== null && daysRemaining <= 14) {
    return 'bg-yellow-50 border-l-4 border-l-yellow-400'
  }
  return 'border-l-4 border-l-transparent'
}

export function UpcomingDeadlines({ items }: UpcomingDeadlinesProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border p-6">
        <h3 className="text-sm font-medium text-gray-600 mb-4">Upcoming Deadlines (90 days)</h3>
        <p className="text-sm text-gray-500 text-center py-4">No upcoming deadlines</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">Upcoming Deadlines (90 days)</h3>
        <Link
          href="/compliance/items"
          className="text-xs text-primary hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="space-y-1">
        {items.map((item) => {
          const daysRemaining = getDaysRemaining(item.due_date)
          const urgencyClass = getRowUrgencyClass(daysRemaining, item.status)

          return (
            <Link
              key={item.id}
              href={`/compliance/items?status=${item.status}`}
              className={`flex items-center justify-between gap-3 px-3 py-2 rounded text-sm hover:bg-gray-50 ${urgencyClass}`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.title}</p>
                <p className="text-xs text-gray-500">
                  {formatCategory(item.category)}
                  {item.assigned_to && ` -- ${item.assigned_to}`}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {item.due_date && (
                  <span className="text-xs text-gray-500">
                    {new Date(item.due_date + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
                {daysRemaining !== null && (
                  <span
                    className={`text-xs font-medium ${
                      daysRemaining < 0
                        ? 'text-red-600'
                        : daysRemaining <= 14
                          ? 'text-yellow-600'
                          : 'text-gray-500'
                    }`}
                  >
                    {daysRemaining < 0
                      ? `${Math.abs(daysRemaining)}d overdue`
                      : daysRemaining === 0
                        ? 'Due today'
                        : `${daysRemaining}d`}
                  </span>
                )}
                <StatusBadge status={item.status} variant="compliance" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
