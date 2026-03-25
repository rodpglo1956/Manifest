'use client'

import { formatDistanceToNow } from 'date-fns'
import { ArrowRightLeft, Truck, FileText } from 'lucide-react'

export type ActivityItem = {
  id: string
  type: 'status_change' | 'dispatch' | 'invoice'
  description: string
  timestamp: string
  link?: string
}

interface ActivityFeedProps {
  items: ActivityItem[]
}

const typeIcons = {
  status_change: ArrowRightLeft,
  dispatch: Truck,
  invoice: FileText,
} as const

const typeColors = {
  status_change: 'text-blue-500 bg-blue-50',
  dispatch: 'text-green-500 bg-green-50',
  invoice: 'text-amber-500 bg-amber-50',
} as const

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-6 text-center">
        <p className="text-sm text-gray-500">No recent activity</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Recent Activity</h3>
      </div>
      <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
        {items.slice(0, 20).map((item) => {
          const Icon = typeIcons[item.type]
          const colorClass = typeColors[item.type]

          return (
            <div key={item.id} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
              <div className={`mt-0.5 p-1.5 rounded-md ${colorClass} flex-shrink-0`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 leading-snug">{item.description}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
