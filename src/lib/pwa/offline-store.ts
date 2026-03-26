import { get, set, del } from 'idb-keyval'

const OFFLINE_QUEUE_KEY = 'offline-queue'

export interface OfflineAction {
  type: 'dvir' | 'fuel_log'
  data: unknown
  timestamp: number
}

/**
 * Queue an action for offline sync.
 * Stores in IndexedDB under 'offline-queue' key as an array.
 */
export async function queueOfflineAction(action: OfflineAction): Promise<void> {
  const queue = (await get<OfflineAction[]>(OFFLINE_QUEUE_KEY)) ?? []
  queue.push(action)
  await set(OFFLINE_QUEUE_KEY, queue)
}

/**
 * Get all queued offline actions, sorted by timestamp (oldest first).
 */
export async function getQueuedActions(): Promise<OfflineAction[]> {
  const queue = (await get<OfflineAction[]>(OFFLINE_QUEUE_KEY)) ?? []
  return queue.sort((a, b) => a.timestamp - b.timestamp)
}

/**
 * Remove a specific action from the queue after successful sync.
 */
export async function clearQueuedAction(timestamp: number): Promise<void> {
  const queue = (await get<OfflineAction[]>(OFFLINE_QUEUE_KEY)) ?? []
  const filtered = queue.filter((a) => a.timestamp !== timestamp)
  await set(OFFLINE_QUEUE_KEY, filtered)
}

/**
 * Clear the entire offline queue (after full sync).
 */
export async function clearAllQueued(): Promise<void> {
  await del(OFFLINE_QUEUE_KEY)
}

/**
 * Get the count of pending offline actions.
 */
export async function getPendingCount(): Promise<number> {
  const queue = (await get<OfflineAction[]>(OFFLINE_QUEUE_KEY)) ?? []
  return queue.length
}
