import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMarieTools, executeTool } from '@/lib/marie/tools'

// Mock the actions module
vi.mock('@/lib/marie/actions', () => ({
  createLoadForMarie: vi.fn().mockResolvedValue({ success: true, load_number: 'LD-001', load_id: 'abc-123' }),
  createDispatchForMarie: vi.fn().mockResolvedValue({ success: true }),
  createInvoiceForMarie: vi.fn().mockResolvedValue({ success: true, invoice_id: 'inv-456' }),
}))

describe('getMarieTools', () => {
  it('returns empty array for driver role', () => {
    const tools = getMarieTools('driver')
    expect(tools).toEqual([])
  })

  it('returns empty array for viewer role', () => {
    const tools = getMarieTools('viewer')
    expect(tools).toEqual([])
  })

  it('returns 3 tools for admin role', () => {
    const tools = getMarieTools('admin')
    expect(tools).toHaveLength(3)
    const names = tools.map((t: { name: string }) => t.name)
    expect(names).toContain('create_load')
    expect(names).toContain('dispatch_driver')
    expect(names).toContain('generate_invoice')
  })

  it('returns 3 tools for dispatcher role', () => {
    const tools = getMarieTools('dispatcher')
    expect(tools).toHaveLength(3)
  })

  it('each tool has name, description, and input_schema', () => {
    const tools = getMarieTools('admin')
    for (const tool of tools) {
      expect(tool).toHaveProperty('name')
      expect(tool).toHaveProperty('description')
      expect(tool).toHaveProperty('input_schema')
      expect(tool.input_schema).toHaveProperty('type', 'object')
      expect(tool.input_schema).toHaveProperty('properties')
      expect(tool.input_schema).toHaveProperty('required')
    }
  })
})

describe('executeTool', () => {
  const mockSupabase = {} as never
  const orgId = 'org-123'
  const userId = 'user-456'

  it('dispatches create_load to createLoadForMarie', async () => {
    const { createLoadForMarie } = await import('@/lib/marie/actions')
    const input = { pickup_city: 'Dallas', pickup_state: 'TX', delivery_city: 'Houston', delivery_state: 'TX', rate_amount: 2800 }

    const result = await executeTool('create_load', input, mockSupabase, orgId, userId)

    expect(createLoadForMarie).toHaveBeenCalledWith(mockSupabase, orgId, userId, input)
    expect(result).toEqual({ success: true, load_number: 'LD-001', load_id: 'abc-123' })
  })

  it('dispatches dispatch_driver to createDispatchForMarie', async () => {
    const { createDispatchForMarie } = await import('@/lib/marie/actions')
    const input = { load_id: 'load-1', driver_id: 'driver-1' }

    const result = await executeTool('dispatch_driver', input, mockSupabase, orgId, userId)

    expect(createDispatchForMarie).toHaveBeenCalledWith(mockSupabase, orgId, userId, input)
    expect(result).toEqual({ success: true })
  })

  it('dispatches generate_invoice to createInvoiceForMarie', async () => {
    const { createInvoiceForMarie } = await import('@/lib/marie/actions')
    const input = { load_id: 'load-1' }

    const result = await executeTool('generate_invoice', input, mockSupabase, orgId, userId)

    expect(createInvoiceForMarie).toHaveBeenCalledWith(mockSupabase, input)
    expect(result).toEqual({ success: true, invoice_id: 'inv-456' })
  })

  it('returns error for unknown tool', async () => {
    const result = await executeTool('unknown_tool', {}, mockSupabase, orgId, userId)
    expect(result).toHaveProperty('error')
  })
})
