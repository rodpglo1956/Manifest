import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildOrgContext } from '@/lib/marie/context-builder'

// Create a mock supabase client with fully chainable query builder
function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const tableData: Record<string, unknown[]> = {
    loads: [
      { id: '1', load_number: 'LD-001', status: 'booked', pickup_city: 'Dallas', pickup_state: 'TX', delivery_city: 'Houston', delivery_state: 'TX', rate_amount: 2800, total_charges: 2800, driver_id: null },
      { id: '2', load_number: 'LD-002', status: 'in_transit', pickup_city: 'Austin', pickup_state: 'TX', delivery_city: 'San Antonio', delivery_state: 'TX', rate_amount: 1500, total_charges: 1500, driver_id: 'd1' },
    ],
    drivers: [
      { id: 'd1', first_name: 'John', last_name: 'Smith', status: 'active', current_vehicle_id: 'v1' },
      { id: 'd2', first_name: 'Jane', last_name: 'Doe', status: 'active', current_vehicle_id: 'v2' },
    ],
    invoices: [
      { id: 'inv1', invoice_number: 'INV-202603-0001', status: 'draft', total: 2800, due_date: '2026-04-25', bill_to_company: 'Acme Corp' },
    ],
    dispatches: [
      { id: 'dis1', load_id: '2', driver_id: 'd1', status: 'en_route_pickup' },
    ],
    ...(overrides as Record<string, unknown[]>),
  }

  function makeChain(data: unknown[]) {
    const result = { data, error: null }
    const chain: Record<string, unknown> = {}
    const methods = ['select', 'eq', 'not', 'in', 'limit', 'order', 'maybeSingle', 'single']
    for (const m of methods) {
      chain[m] = vi.fn(() => makeChain(data))
    }
    // Make it thenable so await works
    chain.then = (resolve: (v: unknown) => void) => resolve(result)
    return chain
  }

  const mockFrom = vi.fn((table: string) => {
    return makeChain(tableData[table] ?? [])
  })

  return { from: mockFrom }
}

describe('buildOrgContext', () => {
  it('returns object with counts and data arrays', async () => {
    const supabase = createMockSupabase()
    const context = await buildOrgContext(supabase as never)

    expect(context).toBeDefined()
    expect(context).toHaveProperty('loads')
    expect(context).toHaveProperty('drivers')
    expect(context).toHaveProperty('invoices')
    expect(context).toHaveProperty('dispatches')
    expect(context).toHaveProperty('summary')
  })

  it('summary contains count fields', async () => {
    const supabase = createMockSupabase()
    const context = await buildOrgContext(supabase as never)

    expect(context.summary).toHaveProperty('activeLoads')
    expect(context.summary).toHaveProperty('activeDrivers')
    expect(context.summary).toHaveProperty('pendingInvoices')
    expect(typeof context.summary.activeLoads).toBe('number')
    expect(typeof context.summary.activeDrivers).toBe('number')
    expect(typeof context.summary.pendingInvoices).toBe('number')
  })

  it('returns arrays for data fields', async () => {
    const supabase = createMockSupabase()
    const context = await buildOrgContext(supabase as never)

    expect(Array.isArray(context.loads)).toBe(true)
    expect(Array.isArray(context.drivers)).toBe(true)
    expect(Array.isArray(context.invoices)).toBe(true)
    expect(Array.isArray(context.dispatches)).toBe(true)
  })
})
