'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { usePushSubscription } from '@/hooks/use-push-subscription'

const STORAGE_KEY = 'push_prompted'

interface PushProviderProps {
  children: ReactNode
  isLoggedIn?: boolean
}

export function PushProvider({ children, isLoggedIn = false }: PushProviderProps) {
  const { isSupported, isSubscribed, subscribe, permission } = usePushSubscription()
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (!isLoggedIn || !isSupported || isSubscribed) return
    if (permission !== 'default') return

    // Check if user has already been prompted
    const prompted = localStorage.getItem(STORAGE_KEY)
    if (prompted) return

    // Show banner after a short delay for better UX
    const timer = setTimeout(() => setShowBanner(true), 2000)
    return () => clearTimeout(timer)
  }, [isLoggedIn, isSupported, isSubscribed, permission])

  const handleEnable = async () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setShowBanner(false)
    await subscribe()
  }

  const handleLater = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setShowBanner(false)
  }

  return (
    <>
      {children}
      {showBanner && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <p className="text-sm font-medium text-gray-900">
            Enable push notifications
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Stay updated on dispatches, load status changes, and critical alerts.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleEnable}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90"
            >
              Enable
            </button>
            <button
              onClick={handleLater}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Later
            </button>
          </div>
        </div>
      )}
    </>
  )
}
