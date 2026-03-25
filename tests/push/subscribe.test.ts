import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendPushToUser } from '@/lib/push/send-notification'

// Mock web-push
const mockSendNotification = vi.fn()
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: (...args: unknown[]) => mockSendNotification(...args),
  },
}))

// Mock vapid config
vi.mock('@/lib/push/vapid', () => ({
  VAPID_PUBLIC_KEY: 'test-public-key',
  VAPID_PRIVATE_KEY: 'test-private-key',
  VAPID_SUBJECT: 'mailto:test@example.com',
}))

function createMockSupabase(subscriptions: Array<{ endpoint: string; keys_p256dh: string; keys_auth: string; id: string }> = []) {
  const deleteMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  })

  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: subscriptions,
          error: null,
        }),
      }),
      delete: deleteMock,
    }),
    _deleteMock: deleteMock,
  }
}

describe('sendPushToUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles empty subscription list gracefully', async () => {
    const supabase = createMockSupabase([])
    await sendPushToUser(supabase as any, 'user-1', {
      title: 'Test',
      body: 'Test body',
    })
    expect(mockSendNotification).not.toHaveBeenCalled()
  })

  it('sends to multiple subscriptions', async () => {
    const subs = [
      { id: 'sub-1', endpoint: 'https://push.example.com/1', keys_p256dh: 'p256dh-1', keys_auth: 'auth-1' },
      { id: 'sub-2', endpoint: 'https://push.example.com/2', keys_p256dh: 'p256dh-2', keys_auth: 'auth-2' },
    ]
    mockSendNotification.mockResolvedValue({ statusCode: 201 })

    const supabase = createMockSupabase(subs)
    await sendPushToUser(supabase as any, 'user-1', {
      title: 'New Load',
      body: 'Load #123 assigned',
      url: '/loads/123',
    })

    expect(mockSendNotification).toHaveBeenCalledTimes(2)
  })

  it('cleans up expired subscriptions (410 Gone)', async () => {
    const subs = [
      { id: 'sub-1', endpoint: 'https://push.example.com/expired', keys_p256dh: 'p256dh-1', keys_auth: 'auth-1' },
    ]
    mockSendNotification.mockRejectedValue({ statusCode: 410 })

    const supabase = createMockSupabase(subs)
    await sendPushToUser(supabase as any, 'user-1', {
      title: 'Test',
      body: 'Test body',
    })

    // Should have called delete on the expired subscription
    expect(supabase.from).toHaveBeenCalledWith('push_subscriptions')
  })
})
