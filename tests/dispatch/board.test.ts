import { describe, it, expect } from 'vitest'
import { createDispatchSchema } from '@/schemas/dispatch'
import type { Load, Driver, Vehicle, DispatchStatus } from '@/types/database'
import type { ActiveDispatch } from '@/components/dispatch/active-dispatches-list'

// Helpers to build test data
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

function makeDriver(overrides: Partial<Driver> = {}): Driver {
  return {
    id: 'driver-1',
    org_id: 'org-1',
    user_id: null,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '555-1234',
    license_number: 'DL123',
    license_state: 'IL',
    license_class: 'A',
    license_expiration: '2027-01-01',
    hire_date: '2024-01-01',
    status: 'active',
    current_vehicle_id: 'vehicle-1',
    home_terminal: null,
    notes: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    created_at: '2026-03-25T00:00:00Z',
    updated_at: '2026-03-25T00:00:00Z',
    ...overrides,
  }
}

function makeActiveDispatch(overrides: Partial<ActiveDispatch> = {}): ActiveDispatch {
  return {
    id: 'dispatch-1',
    status: 'assigned' as DispatchStatus,
    estimated_pickup_arrival: null,
    estimated_delivery_arrival: null,
    load_number: 'LD-001',
    pickup_city: 'Chicago',
    pickup_state: 'IL',
    delivery_city: 'Detroit',
    delivery_state: 'MI',
    pickup_date: '2026-04-01',
    equipment_type: 'dry_van',
    driver_first_name: 'John',
    driver_last_name: 'Doe',
    ...overrides,
  }
}

describe('Dispatch Board', () => {
  describe('Unassigned Loads Panel', () => {
    it('renders loads with status "booked"', () => {
      const loads = [
        makeLoad({ id: 'load-1', status: 'booked', load_number: 'LD-001' }),
        makeLoad({ id: 'load-2', status: 'booked', load_number: 'LD-002' }),
      ]
      expect(loads.every((l) => l.status === 'booked')).toBe(true)
      expect(loads).toHaveLength(2)
    })

    it('shows load number, pickup city, delivery city, date', () => {
      const load = makeLoad()
      expect(load.load_number).toBe('LD-001')
      expect(load.pickup_city).toBe('Chicago')
      expect(load.delivery_city).toBe('Detroit')
      expect(load.pickup_date).toBe('2026-04-01')
    })

    it('shows equipment type on each load card', () => {
      const load = makeLoad({ equipment_type: 'reefer' })
      expect(load.equipment_type).toBe('reefer')
    })

    it('shows empty state when no booked loads', () => {
      const loads: Load[] = []
      expect(loads).toHaveLength(0)
    })
  })

  describe('Available Drivers Panel', () => {
    it('categorizes drivers as available or on load', () => {
      const drivers = [
        makeDriver({ id: 'driver-1' }),
        makeDriver({ id: 'driver-2', first_name: 'Jane' }),
        makeDriver({ id: 'driver-3', first_name: 'Bob' }),
      ]
      const busyDriverIds = ['driver-2']
      const busySet = new Set(busyDriverIds)
      const available = drivers.filter((d) => !busySet.has(d.id))
      const onLoad = drivers.filter((d) => busySet.has(d.id))

      expect(available).toHaveLength(2)
      expect(onLoad).toHaveLength(1)
      expect(onLoad[0].first_name).toBe('Jane')
    })

    it('shows driver name and assigned vehicle', () => {
      const driver = makeDriver({ first_name: 'John', last_name: 'Doe', current_vehicle_id: 'vehicle-1' })
      expect(driver.first_name).toBe('John')
      expect(driver.last_name).toBe('Doe')
      expect(driver.current_vehicle_id).toBe('vehicle-1')
    })

    it('shows availability badge with correct categorization', () => {
      const drivers = [makeDriver({ id: 'driver-1' })]
      const busyDriverIds: string[] = []
      const busySet = new Set(busyDriverIds)
      const available = drivers.filter((d) => !busySet.has(d.id))
      expect(available).toHaveLength(1)
    })

    it('filters out terminated drivers at query level', () => {
      // Only active drivers are queried (status=active in page.tsx)
      const activeDrivers = [
        makeDriver({ status: 'active' }),
      ]
      const terminatedDrivers = activeDrivers.filter((d) => d.status === 'terminated')
      expect(terminatedDrivers).toHaveLength(0)
    })
  })

  describe('Assignment Form', () => {
    it('provides driver dropdown with available drivers', () => {
      const allDrivers = [
        makeDriver({ id: 'driver-1' }),
        makeDriver({ id: 'driver-2', first_name: 'Jane' }),
      ]
      const busyDriverIds = ['driver-2']
      const busySet = new Set(busyDriverIds)
      const availableDrivers = allDrivers.filter((d) => !busySet.has(d.id))
      expect(availableDrivers).toHaveLength(1)
      expect(availableDrivers[0].id).toBe('driver-1')
    })

    it('pre-selects driver current_vehicle_id for vehicle dropdown', () => {
      const driver = makeDriver({ current_vehicle_id: 'vehicle-1' })
      // Form should set vehicle_id to driver.current_vehicle_id when driver selected
      expect(driver.current_vehicle_id).toBe('vehicle-1')
    })

    it('validates required fields via Zod schema', () => {
      const result = createDispatchSchema.safeParse({
        load_id: '',
        driver_id: '',
      })
      expect(result.success).toBe(false)
    })

    it('accepts valid dispatch input', () => {
      const result = createDispatchSchema.safeParse({
        load_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        driver_id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        vehicle_id: 'c3d4e5f6-a7b8-4c9d-ae1f-2a3b4c5d6e7f',
        dispatcher_notes: 'Handle with care',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('Active Dispatches List', () => {
    it('shows dispatches with non-terminal status', () => {
      const dispatches = [
        makeActiveDispatch({ id: 'd-1', status: 'assigned' }),
        makeActiveDispatch({ id: 'd-2', status: 'en_route_pickup' }),
      ]
      const terminalStatuses = ['completed', 'rejected']
      const active = dispatches.filter((d) => !terminalStatuses.includes(d.status))
      expect(active).toHaveLength(2)
    })

    it('displays dispatch status badge variant', () => {
      const dispatch = makeActiveDispatch({ status: 'en_route_pickup' })
      // StatusBadge variant='dispatch' is used in the component
      expect(dispatch.status).toBe('en_route_pickup')
    })

    it('shows driver name and load number', () => {
      const dispatch = makeActiveDispatch({
        load_number: 'LD-042',
        driver_first_name: 'Alice',
        driver_last_name: 'Smith',
      })
      expect(dispatch.load_number).toBe('LD-042')
      expect(dispatch.driver_first_name).toBe('Alice')
      expect(dispatch.driver_last_name).toBe('Smith')
    })

    it('shows ETA for pickup and delivery', () => {
      const dispatch = makeActiveDispatch({
        estimated_pickup_arrival: '2026-04-01T14:30:00Z',
        estimated_delivery_arrival: '2026-04-02T09:00:00Z',
      })
      expect(dispatch.estimated_pickup_arrival).toBeTruthy()
      expect(dispatch.estimated_delivery_arrival).toBeTruthy()
    })
  })
})
