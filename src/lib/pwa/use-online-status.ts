'use client'

import { useState, useEffect, useCallback } from 'react'
import { syncQueuedActions } from './sync-manager'
import { getPendingCount } from './offline-store'

interface OnlineStatus {
  isOnline: boolean
  pendingCount: number
  isSyncing: boolean
}

/**
 * Hook that tracks online/offline status and auto-syncs queued actions on reconnect.
 */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount()
      setPendingCount(count)
    } catch {
      // IndexedDB may not be available
    }
  }, [])

  const handleSync = useCallback(async () => {
    setIsSyncing(true)
    try {
      await syncQueuedActions()
      await refreshPendingCount()
    } finally {
      setIsSyncing(false)
    }
  }, [refreshPendingCount])

  useEffect(() => {
    refreshPendingCount()

    function handleOnline() {
      setIsOnline(true)
      handleSync()
    }

    function handleOffline() {
      setIsOnline(false)
    }

    function handleFocus() {
      if (navigator.onLine) {
        handleSync()
      }
      refreshPendingCount()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('focus', handleFocus)
    }
  }, [handleSync, refreshPendingCount])

  return { isOnline, pendingCount, isSyncing }
}
