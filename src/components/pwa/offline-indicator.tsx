'use client'

import { useState, useEffect } from 'react'
import { useOnlineStatus } from '@/lib/pwa/use-online-status'
import { WifiOff, Loader2, CheckCircle2 } from 'lucide-react'

/**
 * Offline indicator banner for driver PWA.
 * Shows yellow banner when offline, syncing state, and green confirmation on reconnect.
 */
export function OfflineIndicator() {
  const { isOnline, pendingCount, isSyncing } = useOnlineStatus()
  const [showSynced, setShowSynced] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true)
    }

    if (isOnline && wasOffline && !isSyncing) {
      setShowSynced(true)
      const timer = setTimeout(() => {
        setShowSynced(false)
        setWasOffline(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, wasOffline, isSyncing])

  // Syncing state
  if (isSyncing) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white px-4 py-2 text-sm font-medium flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>
          Syncing {pendingCount} change{pendingCount !== 1 ? 's' : ''}...
        </span>
      </div>
    )
  }

  // Just reconnected after sync
  if (showSynced) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white px-4 py-2 text-sm font-medium flex items-center justify-center gap-2">
        <CheckCircle2 className="w-4 h-4" />
        <span>Back online. All changes synced.</span>
      </div>
    )
  }

  // Offline state
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span>You&apos;re offline. Changes will sync when connection returns.</span>
        {pendingCount > 0 && (
          <span className="bg-yellow-700 text-white text-xs px-2 py-0.5 rounded-full ml-1">
            {pendingCount} pending
          </span>
        )}
      </div>
    )
  }

  return null
}
