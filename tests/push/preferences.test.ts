import { describe, it, expect } from 'vitest'

// Test notification preferences defaults and toggle logic
// These test the data contract, not React components

type NotificationPreferences = {
  new_dispatch: boolean
  load_status_change: boolean
  critical_alert: boolean
  invoice_paid: boolean
  driver_response: boolean
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  new_dispatch: true,
  load_status_change: true,
  critical_alert: true,
  invoice_paid: true,
  driver_response: true,
}

function togglePreference(
  prefs: NotificationPreferences,
  key: keyof NotificationPreferences
): NotificationPreferences {
  return { ...prefs, [key]: !prefs[key] }
}

describe('Notification Preferences', () => {
  it('defaults all preferences to true', () => {
    expect(DEFAULT_PREFERENCES.new_dispatch).toBe(true)
    expect(DEFAULT_PREFERENCES.load_status_change).toBe(true)
    expect(DEFAULT_PREFERENCES.critical_alert).toBe(true)
    expect(DEFAULT_PREFERENCES.invoice_paid).toBe(true)
    expect(DEFAULT_PREFERENCES.driver_response).toBe(true)
  })

  it('toggle mutation updates correct field', () => {
    const toggled = togglePreference(DEFAULT_PREFERENCES, 'critical_alert')
    expect(toggled.critical_alert).toBe(false)
    // Other fields unchanged
    expect(toggled.new_dispatch).toBe(true)
    expect(toggled.load_status_change).toBe(true)
    expect(toggled.invoice_paid).toBe(true)
    expect(toggled.driver_response).toBe(true)
  })

  it('toggle is reversible', () => {
    const first = togglePreference(DEFAULT_PREFERENCES, 'invoice_paid')
    expect(first.invoice_paid).toBe(false)
    const second = togglePreference(first, 'invoice_paid')
    expect(second.invoice_paid).toBe(true)
  })

  it('merges partial preferences with defaults', () => {
    const partial = { new_dispatch: false }
    const merged: NotificationPreferences = {
      ...DEFAULT_PREFERENCES,
      ...partial,
    }
    expect(merged.new_dispatch).toBe(false)
    expect(merged.critical_alert).toBe(true)
  })
})
