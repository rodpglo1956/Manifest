'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Bell } from 'lucide-react'
import { acknowledgeAlert } from '@/lib/alerts/actions'
import { getSeverityBadgeClasses, formatAlertTime, ALERT_TYPE_LABELS } from '@/lib/alerts/alert-helpers'
import type { ProactiveAlert, AlertSeverity, AlertType } from '@/types/database'

interface AlertFeedProps {
  alerts: ProactiveAlert[]
}

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

const SEVERITY_BORDER: Record<string, string> = {
  critical: 'border-l-4 border-l-red-500',
  warning: 'border-l-4 border-l-yellow-500',
  info: 'border-l-4 border-l-blue-500',
}

function SeverityIcon({ severity }: { severity: string }) {
  const iconClass = 'h-4 w-4 flex-shrink-0'
  switch (severity) {
    case 'critical':
      return <AlertTriangle className={`${iconClass} text-red-600`} />
    case 'warning':
      return <AlertCircle className={`${iconClass} text-yellow-600`} />
    case 'info':
    default:
      return <Info className={`${iconClass} text-blue-600`} />
  }
}

function getEntityLink(entityType: string | null, entityId: string | null): string | null {
  if (!entityType || !entityId) return null
  switch (entityType) {
    case 'load':
      return `/loads/${entityId}`
    case 'driver':
      return `/drivers/${entityId}`
    case 'dispatch':
      return `/dispatch`
    case 'invoice':
      return `/invoices/${entityId}`
    default:
      return null
  }
}

export function AlertFeed({ alerts }: AlertFeedProps) {
  // Sort: critical first, then warning, then info
  const sortedAlerts = [...alerts].sort((a, b) => {
    const orderA = SEVERITY_ORDER[a.severity] ?? 3
    const orderB = SEVERITY_ORDER[b.severity] ?? 3
    if (orderA !== orderB) return orderA - orderB
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">Active Alerts</h3>
        </div>
        {sortedAlerts.length > 0 && (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            {sortedAlerts.length}
          </span>
        )}
      </div>

      {sortedAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <CheckCircle2 className="h-8 w-8 mb-2" />
          <p className="text-sm">No active alerts</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedAlerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  )
}

function AlertItem({ alert }: { alert: ProactiveAlert }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const borderClass = SEVERITY_BORDER[alert.severity] ?? ''
  const entityLink = getEntityLink(alert.related_entity_type, alert.related_entity_id)
  const typeLabel = ALERT_TYPE_LABELS[alert.alert_type as AlertType] ?? alert.alert_type

  function handleAcknowledge() {
    startTransition(async () => {
      const result = await acknowledgeAlert(alert.id)
      if (!result.error) {
        router.refresh()
      }
    })
  }

  return (
    <div className={`rounded-lg bg-gray-50 p-3 ${borderClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <SeverityIcon severity={alert.severity} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={getSeverityBadgeClasses(alert.severity as AlertSeverity)}>
                {alert.severity}
              </span>
              <span className="text-xs text-gray-500">{typeLabel}</span>
            </div>
            <p className="text-sm font-medium text-gray-900 mt-1">{alert.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{alert.message}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-400">{formatAlertTime(alert.created_at)}</span>
              {entityLink && (
                <a
                  href={entityLink}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                >
                  View details
                </a>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleAcknowledge}
          disabled={isPending}
          className="flex-shrink-0 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Ack...' : 'Acknowledge'}
        </button>
      </div>
    </div>
  )
}
