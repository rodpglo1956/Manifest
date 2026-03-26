import { getQueuedActions, clearQueuedAction, type OfflineAction } from './offline-store'
import { submitDVIR } from '@/lib/compliance/actions'
import { createFuelTransaction } from '@/lib/fleet/actions'

export interface SyncResult {
  synced: number
  failed: number
}

/**
 * Replay all queued offline actions to the server.
 * Clears each action on success, keeps on failure.
 */
export async function syncQueuedActions(): Promise<SyncResult> {
  const actions = await getQueuedActions()
  let synced = 0
  let failed = 0

  for (const action of actions) {
    try {
      const success = await replayAction(action)
      if (success) {
        await clearQueuedAction(action.timestamp)
        synced++
      } else {
        failed++
      }
    } catch {
      failed++
    }
  }

  return { synced, failed }
}

async function replayAction(action: OfflineAction): Promise<boolean> {
  switch (action.type) {
    case 'dvir': {
      const result = await submitDVIR(action.data as Parameters<typeof submitDVIR>[0])
      return !result.error
    }
    case 'fuel_log': {
      const formData = new FormData()
      const data = action.data as Record<string, string>
      for (const [key, value] of Object.entries(data)) {
        formData.append(key, value)
      }
      const result = await createFuelTransaction(formData)
      return !result.error
    }
    default:
      return false
  }
}

/**
 * Register a background sync event with the service worker.
 * Falls back silently if SyncManager is not supported.
 */
export async function registerBackgroundSync(): Promise<void> {
  if (typeof navigator === 'undefined') return
  if (!('serviceWorker' in navigator)) return

  try {
    const registration = await navigator.serviceWorker.ready
    // SyncManager is not in all TS lib types
    if ('sync' in registration) {
      await (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register(
        'manifest-offline-sync'
      )
    }
  } catch {
    // Background sync not supported, will rely on online event
  }
}
