'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { Shield, AlertTriangle, AlertCircle, Info, CheckCircle, Plus, List, Users } from 'lucide-react'
import { HealthScoreGauge } from './health-score-gauge'
import { UpcomingDeadlines } from './upcoming-deadlines'
import type { HealthScoreMetrics } from '@/lib/compliance/compliance-helpers'
import type { ComplianceAlert, ComplianceItem } from '@/types/database'
import { acknowledgeComplianceAlert } from '@/lib/compliance/actions'

interface ComplianceDashboardProps {
  healthScore: number
  metrics: HealthScoreMetrics
  recentAlerts: ComplianceAlert[]
  upcomingItems: ComplianceItem[]
  isDotRegulated: boolean
}

function getAlertSeverityColor(alertType: string): string {
  switch (alertType) {
    case 'overdue':
    case 'expired':
      return 'bg-red-100 text-red-800'
    case 'due_soon':
      return 'bg-yellow-100 text-yellow-800'
    case 'approaching':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getAlertIcon(alertType: string) {
  switch (alertType) {
    case 'overdue':
    case 'expired':
      return <AlertTriangle className="w-4 h-4 text-red-500" />
    case 'due_soon':
      return <AlertCircle className="w-4 h-4 text-yellow-500" />
    case 'approaching':
      return <Info className="w-4 h-4 text-blue-500" />
    default:
      return <Info className="w-4 h-4 text-gray-500" />
  }
}

function formatAlertType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function AlertRow({ alert }: { alert: ComplianceAlert }) {
  const [isPending, startTransition] = useTransition()

  function handleAcknowledge() {
    startTransition(async () => {
      await acknowledgeComplianceAlert(alert.id)
    })
  }

  return (
    <div className="flex items-start gap-3 px-3 py-2 rounded hover:bg-gray-50">
      <div className="flex-shrink-0 mt-0.5">{getAlertIcon(alert.alert_type)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{alert.message}</p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getAlertSeverityColor(alert.alert_type)}`}
          >
            {formatAlertType(alert.alert_type)}
          </span>
          {alert.days_until_due !== null && (
            <span className="text-xs text-gray-500">
              {alert.days_until_due < 0
                ? `${Math.abs(alert.days_until_due)}d overdue`
                : alert.days_until_due === 0
                  ? 'Due today'
                  : `${alert.days_until_due}d remaining`}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={handleAcknowledge}
        disabled={isPending}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50"
        title="Acknowledge"
      >
        <CheckCircle className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ComplianceDashboard({
  healthScore,
  metrics,
  recentAlerts,
  upcomingItems,
  isDotRegulated,
}: ComplianceDashboardProps) {
  // Stat cards data
  const completedThisMonth = 0 // Would need a separate query -- shown as placeholder
  const statCards = [
    { label: 'Total Active Items', value: metrics.totalItems, color: 'text-blue-600' },
    { label: 'Overdue', value: metrics.overdueItems, color: metrics.overdueItems > 0 ? 'text-red-600' : 'text-green-600' },
    { label: 'Due Soon', value: metrics.dueSoonItems, color: metrics.dueSoonItems > 0 ? 'text-yellow-600' : 'text-green-600' },
    { label: 'Completed This Month', value: completedThisMonth, color: 'text-green-600' },
  ]

  return (
    <div className="space-y-6">
      {/* Top Row: Health Score + Stat Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <HealthScoreGauge score={healthScore} metrics={metrics} />
        </div>
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-lg border bg-white p-4">
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/compliance/items"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <List className="w-4 h-4" />
          View All Items
        </Link>
        <Link
          href="/compliance/items?addItem=true"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Add Compliance Item
        </Link>
        {isDotRegulated && (
          <Link
            href="/compliance/drivers"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Users className="w-4 h-4" />
            DQ File Tracker
          </Link>
        )}
      </div>

      {/* Middle: Recent Compliance Alerts */}
      <div className="rounded-lg border p-6">
        <h3 className="text-sm font-medium text-gray-600 mb-4">
          Recent Compliance Alerts
          {recentAlerts.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
              {recentAlerts.length}
            </span>
          )}
        </h3>
        {recentAlerts.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-green-600 py-4 justify-center">
            <Shield className="w-4 h-4" />
            <span>No unacknowledged compliance alerts</span>
          </div>
        ) : (
          <div className="space-y-1">
            {recentAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom: Upcoming Deadlines */}
      <UpcomingDeadlines items={upcomingItems} />
    </div>
  )
}
