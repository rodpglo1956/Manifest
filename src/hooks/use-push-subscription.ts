'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushSubscription() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window

    setIsSupported(supported)

    if (!supported) return

    // Register service worker and check existing subscription
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registrationRef.current = registration
        return registration.pushManager.getSubscription()
      })
      .then((subscription) => {
        setIsSubscribed(!!subscription)
      })
      .catch(() => {
        // Service worker registration failed silently
      })

    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const subscribe = useCallback(async () => {
    if (!registrationRef.current || !VAPID_PUBLIC_KEY) return false

    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result !== 'granted') return false

      const subscription = await registrationRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      })

      const json = subscription.toJSON()

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: {
            p256dh: json.keys?.p256dh,
            auth: json.keys?.auth,
          },
        }),
      })

      if (response.ok) {
        setIsSubscribed(true)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    if (!registrationRef.current) return false

    try {
      const subscription =
        await registrationRef.current.pushManager.getSubscription()

      if (subscription) {
        const endpoint = subscription.endpoint
        await subscription.unsubscribe()

        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        })
      }

      setIsSubscribed(false)
      return true
    } catch {
      return false
    }
  }, [])

  return { isSupported, isSubscribed, subscribe, unsubscribe, permission }
}
