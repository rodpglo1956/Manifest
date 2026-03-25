'use client'

import { useRealtimeDashboard } from '@/hooks/use-realtime-dashboard'
import { StatCards } from './stat-cards'
import { ActivityFeed, type ActivityItem } from './activity-feed'
import { QuickActions } from './quick-actions'

interface DashboardViewProps {
  orgId: string
  activeLoads: number
  bookedToday: number
  driversOnDuty: number
  revenueMtd: number
  activityItems: ActivityItem[]
  isOwnerOperator?: boolean
  userName?: string
}

export function DashboardView({
  orgId,
  activeLoads,
  bookedToday,
  driversOnDuty,
  revenueMtd,
  activityItems,
  isOwnerOperator,
  userName,
}: DashboardViewProps) {
  // Subscribe to realtime updates for dashboard refresh
  useRealtimeDashboard(orgId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isOwnerOperator ? 'Your Operation' : 'Dashboard'}
        </h1>
        {userName && (
          <p className="text-gray-500 mt-1">
            Welcome back, {userName}
          </p>
        )}
      </div>

      <StatCards
        activeLoads={activeLoads}
        bookedToday={bookedToday}
        driversOnDuty={driversOnDuty}
        revenueMtd={revenueMtd}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityFeed items={activityItems} />
        </div>
        <div>
          <div className="bg-white rounded-lg border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  )
}
