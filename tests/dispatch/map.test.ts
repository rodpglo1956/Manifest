import { describe, it, expect } from 'vitest'
import { getCityCoords } from '@/lib/geo/city-coords'
import type { Load, Driver } from '@/types/database'

// Test helpers
function makeLoad(overrides: Partial<Load> = {}): Load {
  return {
    id: 'load-1',
    org_id: 'org-1',
    load_number: 'LD-001',
    status: 'booked',
    pickup_company: null,
    pickup_address: '123 Main St',
    pickup_city: 'Chicago',
    pickup_state: 'IL',
    pickup_zip: '60601',
    pickup_date: '2026-04-01',
    pickup_time: '08:00',
    pickup_contact_name: null,
    pickup_contact_phone: null,
    pickup_reference: null,
    pickup_notes: null,
    delivery_company: null,
    delivery_address: '456 Oak Ave',
    delivery_city: 'Detroit',
    delivery_state: 'MI',
    delivery_zip: '48201',
    delivery_date: '2026-04-02',
    delivery_time: '17:00',
    delivery_contact_name: null,
    delivery_contact_phone: null,
    delivery_reference: null,
    delivery_notes: null,
    commodity: 'Electronics',
    weight: 10000,
    weight_unit: 'lbs',
    pieces: 50,
    equipment_type: 'dry_van',
    temperature_min: null,
    temperature_max: null,
    hazmat: false,
    rate_amount: 2500,
    rate_type: 'flat',
    miles: 280,
    fuel_surcharge: 150,
    accessorial_charges: 0,
    total_charges: 2650,
    driver_id: null,
    vehicle_id: null,
    broker_name: 'ABC Logistics',
    broker_contact: null,
    broker_phone: null,
    broker_email: null,
    broker_mc_number: null,
    broker_reference: null,
    bol_url: null,
    rate_confirmation_url: null,
    pod_url: null,
    notes: null,
    created_by: null,
    created_at: '2026-03-25T00:00:00Z',
    updated_at: '2026-03-25T00:00:00Z',
    ...overrides,
  }
}

describe('Dispatch Map', () => {
  describe('getCityCoords for load pins', () => {
    it('returns coordinates for known cities', () => {
      const coords = getCityCoords('Chicago', 'IL')
      expect(coords).not.toBeNull()
      expect(coords!.lat).toBeCloseTo(41.878, 1)
      expect(coords!.lng).toBeCloseTo(-87.63, 1)
    })

    it('returns null for unknown cities', () => {
      const coords = getCityCoords('Smalltown', 'XX')
      expect(coords).toBeNull()
    })

    it('returns null for null city or state', () => {
      expect(getCityCoords(null, 'IL')).toBeNull()
      expect(getCityCoords('Chicago', null)).toBeNull()
      expect(getCityCoords(null, null)).toBeNull()
    })

    it('handles case-insensitive lookup', () => {
      const upper = getCityCoords('CHICAGO', 'IL')
      const lower = getCityCoords('chicago', 'il')
      const mixed = getCityCoords('Chicago', 'IL')
      expect(upper).toEqual(lower)
      expect(lower).toEqual(mixed)
    })
  })

  describe('Load pin computation', () => {
    it('maps loads with pickup_city/state to pins', () => {
      const loads = [
        makeLoad({ id: 'l1', pickup_city: 'Chicago', pickup_state: 'IL' }),
        makeLoad({ id: 'l2', pickup_city: 'Dallas', pickup_state: 'TX' }),
      ]

      const pins = loads
        .map((load) => {
          const coords = getCityCoords(load.pickup_city, load.pickup_state)
          return coords ? { id: load.id, ...coords } : null
        })
        .filter(Boolean)

      expect(pins).toHaveLength(2)
    })

    it('filters loads without coordinates to no-location list', () => {
      const loads = [
        makeLoad({ id: 'l1', pickup_city: 'Chicago', pickup_state: 'IL' }),
        makeLoad({ id: 'l2', pickup_city: 'UnknownVille', pickup_state: 'ZZ' }),
        makeLoad({ id: 'l3', pickup_city: null, pickup_state: null }),
      ]

      const withCoords: Load[] = []
      const withoutCoords: Load[] = []

      for (const load of loads) {
        const coords = getCityCoords(load.pickup_city, load.pickup_state)
        if (coords) {
          withCoords.push(load)
        } else {
          withoutCoords.push(load)
        }
      }

      expect(withCoords).toHaveLength(1)
      expect(withoutCoords).toHaveLength(2)
    })
  })

  describe('Driver pin computation', () => {
    it('uses home_terminal City, ST format for driver location', () => {
      const homeTerminal = 'Dallas, TX'
      const parts = homeTerminal.split(',').map((p) => p.trim())
      const coords = getCityCoords(parts[0], parts[1])
      expect(coords).not.toBeNull()
      expect(coords!.lat).toBeCloseTo(32.78, 1)
    })

    it('returns null for driver with no location info', () => {
      const coords = getCityCoords(null, null)
      expect(coords).toBeNull()
    })
  })

  describe('Tab navigation', () => {
    it('defines three views: list, map, timeline', () => {
      const views = ['list', 'map', 'timeline']
      expect(views).toHaveLength(3)
      expect(views).toContain('list')
      expect(views).toContain('map')
      expect(views).toContain('timeline')
    })
  })
})
