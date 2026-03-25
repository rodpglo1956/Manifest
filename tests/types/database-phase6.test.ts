import { describe, it, expect } from 'vitest'
import type {
  DailySnapshot,
  PushSubscription,
  AlertType,
  AlertSeverity,
  NotificationPreferences,
  Profile,
  Database,
} from '@/types/database'

describe('Phase 6 Database Types', () => {
  describe('DailySnapshot', () => {
    it('has all 14 fields per PRD-02 Section 5.2', () => {
      const snapshot: DailySnapshot = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        org_id: '660e8400-e29b-41d4-a716-446655440001',
        snapshot_date: '2026-03-24',
        loads_booked: 10,
        loads_delivered: 8,
        loads_canceled: 1,
        revenue: 25000.0,
        total_miles: 5000,
        revenue_per_mile: 5.0,
        on_time_deliveries: 7,
        total_deliveries: 8,
        on_time_percentage: 87.5,
        active_drivers: 5,
        invoices_generated: 6,
        invoices_paid: 15000.0,
        created_at: '2026-03-25T01:00:00Z',
      }
      expect(snapshot.id).toBeDefined()
      expect(snapshot.snapshot_date).toBe('2026-03-24')
      expect(snapshot.on_time_percentage).toBe(87.5)
      expect(snapshot.revenue_per_mile).toBe(5.0)
    })
  })

  describe('PushSubscription', () => {
    it('has user_id, endpoint, keys_p256dh, keys_auth', () => {
      const sub: PushSubscription = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: '660e8400-e29b-41d4-a716-446655440001',
        org_id: '770e8400-e29b-41d4-a716-446655440002',
        endpoint: 'https://fcm.googleapis.com/fcm/send/xyz',
        keys_p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0...',
        keys_auth: 'tBHItJI5svbpC7htMh...',
        created_at: '2026-03-25T00:00:00Z',
      }
      expect(sub.endpoint).toContain('fcm')
      expect(sub.keys_p256dh).toBeDefined()
      expect(sub.keys_auth).toBeDefined()
    })
  })

  describe('AlertType', () => {
    it('covers all 6 alert types', () => {
      const types: AlertType[] = [
        'late_pickup',
        'driver_silent',
        'overdue_invoice',
        'dispatch_conflict',
        'eta_risk',
        'unassigned_load',
      ]
      expect(types).toHaveLength(6)
    })
  })

  describe('AlertSeverity', () => {
    it('has info, warning, critical', () => {
      const severities: AlertSeverity[] = ['info', 'warning', 'critical']
      expect(severities).toHaveLength(3)
    })
  })

  describe('NotificationPreferences', () => {
    it('has all 5 preference types', () => {
      const prefs: NotificationPreferences = {
        new_dispatch: true,
        load_status_change: true,
        critical_alert: true,
        invoice_paid: true,
        driver_response: true,
      }
      expect(prefs.new_dispatch).toBe(true)
      expect(prefs.critical_alert).toBe(true)
    })
  })

  describe('Database type extensions', () => {
    it('includes daily_snapshots table entry', () => {
      // Type-level check - if this compiles, the table entry exists
      type DailySnapshotsRow = Database['public']['Tables']['daily_snapshots']['Row']
      const row: DailySnapshotsRow = {} as DailySnapshot
      expect(row).toBeDefined()
    })

    it('includes push_subscriptions table entry', () => {
      type PushSubscriptionsRow = Database['public']['Tables']['push_subscriptions']['Row']
      const row: PushSubscriptionsRow = {} as PushSubscription
      expect(row).toBeDefined()
    })
  })
})
