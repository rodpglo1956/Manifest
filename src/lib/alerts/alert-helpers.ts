import type { AlertType, AlertSeverity } from '@/types/database'

export type { AlertType }

/**
 * Returns Tailwind color classes for alert severity
 */
export function getSeverityColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800'
    case 'warning':
      return 'bg-yellow-100 text-yellow-800'
    case 'info':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Returns Lucide icon name for alert severity
 */
export function getSeverityIcon(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical':
      return 'AlertTriangle'
    case 'warning':
      return 'AlertCircle'
    case 'info':
      return 'Info'
    default:
      return 'Info'
  }
}

/**
 * Returns full badge styling classes for alert severity
 */
export function getSeverityBadgeClasses(severity: AlertSeverity): string {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
  switch (severity) {
    case 'critical':
      return `${base} bg-red-100 text-red-800`
    case 'warning':
      return `${base} bg-yellow-100 text-yellow-800`
    case 'info':
      return `${base} bg-blue-100 text-blue-800`
    default:
      return `${base} bg-gray-100 text-gray-800`
  }
}

/**
 * Formats alert creation time as relative time string
 */
export function formatAlertTime(createdAt: string): string {
  const now = Date.now()
  const created = new Date(createdAt).getTime()
  const diffMs = now - created

  const minutes = Math.floor(diffMs / (1000 * 60))
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  return `${days} day${days > 1 ? 's' : ''} ago`
}

/**
 * Human-readable labels for all 6 alert types
 */
export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  late_pickup: 'Late Pickup Risk',
  driver_silent: 'Driver Silent',
  overdue_invoice: 'Overdue Invoice',
  dispatch_conflict: 'Dispatch Conflict',
  eta_risk: 'ETA Risk',
  unassigned_load: 'Unassigned Load',
}
