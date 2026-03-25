import { getStatusLabel } from '@/lib/load-status'
import { StatusBadge } from '@/components/ui/status-badge'
import type { LoadStatusHistory } from '@/types/database'

interface LoadTimelineProps {
  statusHistory: (LoadStatusHistory & {
    changed_by_name?: string | null
  })[]
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }) + ' at ' + date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function LoadTimeline({ statusHistory }: LoadTimelineProps) {
  if (statusHistory.length === 0) {
    return (
      <div className="text-sm text-gray-500">No status history recorded.</div>
    )
  }

  // Most recent first (should already be ordered desc from query)
  const sorted = [...statusHistory].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="space-y-0">
      {sorted.map((entry, index) => {
        const isLast = index === sorted.length - 1

        return (
          <div key={entry.id} className="flex gap-3">
            {/* Timeline line and dot */}
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-primary border-2 border-primary-light shrink-0 mt-1.5" />
              {!isLast && (
                <div className="w-px flex-1 bg-gray-200 min-h-[24px]" />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={entry.new_status} variant="load" />
                {entry.old_status && (
                  <span className="text-xs text-gray-400">
                    from {getStatusLabel(entry.old_status as Parameters<typeof getStatusLabel>[0])}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span>{formatTimestamp(entry.created_at)}</span>
                {entry.changed_by_name && (
                  <>
                    <span className="text-gray-300">-</span>
                    <span>{entry.changed_by_name}</span>
                  </>
                )}
              </div>
              {entry.notes && (
                <p className="mt-1 text-xs text-gray-600">{entry.notes}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
