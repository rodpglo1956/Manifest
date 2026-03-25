import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock modules before importing
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import {
  getUnacknowledgedAlerts,
  acknowledgeAlert,
  getAlertCount,
} from '@/lib/alerts/actions'

const mockCreateClient = vi.mocked(createClient)

function createMockSupabase({
  alerts = [] as any[],
  user = { id: 'user-1' },
  updateError = null as any,
  count = 0,
} = {}) {
  const eqChain = vi.fn().mockReturnThis()
  const orderChain = vi.fn().mockReturnThis()
  const limitChain = vi.fn().mockResolvedValue({ data: alerts, error: null })

  const updateEqChain = vi.fn().mockResolvedValue({ data: null, error: updateError })

  return {
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: updateError }),
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: alerts, error: null }),
          }),
        }),
        // For count queries
        head: true,
      }),
      update: vi.fn().mockReturnValue({
        eq: updateEqChain,
      }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
  } as any
}

describe('alert actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUnacknowledgedAlerts', () => {
    it('returns alerts ordered by created_at desc, limit 20', async () => {
      const mockAlerts = [
        { id: '1', title: 'Alert 1', acknowledged: false, created_at: '2026-03-25T10:00:00Z' },
        { id: '2', title: 'Alert 2', acknowledged: false, created_at: '2026-03-25T09:00:00Z' },
      ]

      // Build a chain that tracks method calls
      const limitMock = vi.fn().mockResolvedValue({ data: mockAlerts, error: null })
      const orderMock = vi.fn().mockReturnValue({ limit: limitMock })
      const eqMock = vi.fn().mockReturnValue({ order: orderMock })
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock })

      const mockSupabase = {
        from: vi.fn().mockReturnValue({ select: selectMock }),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      }
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const result = await getUnacknowledgedAlerts()

      expect(result).toEqual(mockAlerts)
      expect(mockSupabase.from).toHaveBeenCalledWith('proactive_alerts')
      expect(eqMock).toHaveBeenCalledWith('acknowledged', false)
      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(limitMock).toHaveBeenCalledWith(20)
    })

    it('returns empty array when no alerts exist', async () => {
      const limitMock = vi.fn().mockResolvedValue({ data: [], error: null })
      const orderMock = vi.fn().mockReturnValue({ limit: limitMock })
      const eqMock = vi.fn().mockReturnValue({ order: orderMock })
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock })

      const mockSupabase = {
        from: vi.fn().mockReturnValue({ select: selectMock }),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      }
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const result = await getUnacknowledgedAlerts()
      expect(result).toEqual([])
    })
  })

  describe('acknowledgeAlert', () => {
    it('updates acknowledged=true and acknowledged_by for given alert id', async () => {
      const eqAfterUpdate = vi.fn().mockResolvedValue({ data: { id: '1' }, error: null })
      const updateMock = vi.fn().mockReturnValue({ eq: eqAfterUpdate })

      // Select for validation returns existing unacknowledged alert
      const singleMock = vi.fn().mockResolvedValue({
        data: { id: '1', acknowledged: false },
        error: null,
      })
      const selectEqMock = vi.fn().mockReturnValue({ single: singleMock })
      const selectMock = vi.fn().mockReturnValue({ eq: selectEqMock })

      const mockSupabase = {
        from: vi.fn().mockReturnValue({ select: selectMock, update: updateMock }),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      }
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const result = await acknowledgeAlert('alert-1')

      expect(result.error).toBeUndefined()
    })

    it('returns error if alert already acknowledged', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: { id: '1', acknowledged: true },
        error: null,
      })
      const selectEqMock = vi.fn().mockReturnValue({ single: singleMock })
      const selectMock = vi.fn().mockReturnValue({ eq: selectEqMock })

      const mockSupabase = {
        from: vi.fn().mockReturnValue({ select: selectMock }),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      }
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const result = await acknowledgeAlert('alert-1')

      expect(result.error).toBeDefined()
    })

    it('returns error if alert not found', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      })
      const selectEqMock = vi.fn().mockReturnValue({ single: singleMock })
      const selectMock = vi.fn().mockReturnValue({ eq: selectEqMock })

      const mockSupabase = {
        from: vi.fn().mockReturnValue({ select: selectMock }),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      }
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const result = await acknowledgeAlert('nonexistent')

      expect(result.error).toBeDefined()
    })
  })

  describe('getAlertCount', () => {
    it('returns count of unacknowledged alerts', async () => {
      const eqMock = vi.fn().mockResolvedValue({ count: 5, error: null })
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock })

      const mockSupabase = {
        from: vi.fn().mockReturnValue({ select: selectMock }),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      }
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const result = await getAlertCount()

      expect(result).toBe(5)
    })
  })
})
