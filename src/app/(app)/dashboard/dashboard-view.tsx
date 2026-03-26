'use client'

import { useRealtimeDashboard } from '@/hooks/use-realtime-dashboard'
import { StatCards } from './stat-cards'
import { AlertFeed } from './alert-feed'
import { ActivityFeed, type ActivityItem } from './activity-feed'
import { QuickActions } from './quick-actions'
import { calculateCurrentMonthOnTime } from '@/lib/analytics/snapshot-helpers'
import { RevenueTrendChart } from './charts/revenue-trend-chart'
import { LoadVolumeChart } from './charts/load-volume-chart'
import { OnTimeGauge } from './charts/on-time-gauge'
import { RpmTrendChart } from './charts/rpm-trend-chart'
import { GettingStartedChecklist } from '@/components/onboarding/getting-started-checklist'
import type { ChecklistItem } from '@/lib/onboarding/actions'
import type { DailySnapshot, ProactiveAlert } from '@/types/database'

interface DashboardViewProps {
  orgId: string
  activeLoads: number
  bookedToday: number
  driversOnDuty: number
  revenueMtd: number
  alerts: ProactiveAlert[]
  snapshots: DailySnapshot[]
  activityItems: ActivityItem[]
  isOwnerOperator?: boolean
  userName?: string
  checklistItems?: ChecklistItem[]
}

export function DashboardView({
  orgId,
  activeLoads,
  bookedToday,
  driversOnDuty,
  revenueMtd,
  alerts,
  snapshots,
  activityItems,
  isOwnerOperator,
  userName,
  checklistItems,
}: DashboardViewProps) {
  // Subscribe to realtime updates for dashboard refresh
  useRealtimeDashboard(orgId)

  const onTimePercentage = calculateCurrentMonthOnTime(snapshots)

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

      {checklistItems && checklistItems.length > 0 && (
        <GettingStartedChecklist items={checklistItems} />
      )}

      <StatCards
        activeLoads={activeLoads}
        bookedToday={bookedToday}
        driversOnDuty={driversOnDuty}
        revenueMtd={revenueMtd}
      />

      {/* Analytics Charts -- 2x2 grid below stat cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueTrendChart data={snapshots} />
        <LoadVolumeChart data={snapshots} />
        <OnTimeGauge percentage={onTimePercentage} />
        <RpmTrendChart data={snapshots} />
      </div>

      {/* Alert Feed -- above activity feed */}
      <AlertFeed alerts={alerts} />

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
