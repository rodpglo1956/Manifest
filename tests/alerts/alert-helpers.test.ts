import { describe, it, expect } from 'vitest'
import {
  getSeverityColor,
  getSeverityIcon,
  getSeverityBadgeClasses,
  formatAlertTime,
  ALERT_TYPE_LABELS,
} from '@/lib/alerts/alert-helpers'
import type { AlertType, AlertSeverity } from '@/types/database'

describe('alert-helpers', () => {
  describe('getSeverityColor', () => {
    it('returns red for critical', () => {
      const result = getSeverityColor('critical')
      expect(result).toContain('red')
    })

    it('returns yellow for warning', () => {
      const result = getSeverityColor('warning')
      expect(result).toContain('yellow')
    })

    it('returns blue for info', () => {
      const result = getSeverityColor('info')
      expect(result).toContain('blue')
    })
  })

  describe('getSeverityIcon', () => {
    it('returns AlertTriangle for critical', () => {
      expect(getSeverityIcon('critical')).toBe('AlertTriangle')
    })

    it('returns AlertCircle for warning', () => {
      expect(getSeverityIcon('warning')).toBe('AlertCircle')
    })

    it('returns Info for info', () => {
      expect(getSeverityIcon('info')).toBe('Info')
    })
  })

  describe('getSeverityBadgeClasses', () => {
    it('returns full badge classes for critical', () => {
      const result = getSeverityBadgeClasses('critical')
      expect(result).toContain('bg-')
      expect(result).toContain('text-')
    })

    it('returns full badge classes for warning', () => {
      const result = getSeverityBadgeClasses('warning')
      expect(result).toContain('bg-')
      expect(result).toContain('text-')
    })

    it('returns full badge classes for info', () => {
      const result = getSeverityBadgeClasses('info')
      expect(result).toContain('bg-')
      expect(result).toContain('text-')
    })
  })

  describe('formatAlertTime', () => {
    it('formats recent time as minutes ago', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      expect(formatAlertTime(fiveMinAgo)).toContain('min ago')
    })

    it('formats hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      expect(formatAlertTime(twoHoursAgo)).toContain('hour')
    })

    it('formats days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      expect(formatAlertTime(threeDaysAgo)).toContain('day')
    })
  })

  describe('ALERT_TYPE_LABELS', () => {
    it('has labels for all 6 alert types', () => {
      const alertTypes: AlertType[] = [
        'late_pickup',
        'driver_silent',
        'overdue_invoice',
        'dispatch_conflict',
        'eta_risk',
        'unassigned_load',
      ]

      alertTypes.forEach((type) => {
        expect(ALERT_TYPE_LABELS[type]).toBeDefined()
        expect(typeof ALERT_TYPE_LABELS[type]).toBe('string')
        expect(ALERT_TYPE_LABELS[type].length).toBeGreaterThan(0)
      })
    })
  })
})
