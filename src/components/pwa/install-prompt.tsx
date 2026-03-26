'use client'

import { useState, useEffect, useRef } from 'react'
import { Download, X, Share } from 'lucide-react'

const DISMISSED_KEY = 'manifest-install-prompt-dismissed'

/**
 * PWA install prompt for mobile users.
 * Detects installability via beforeinstallprompt (Android/Chrome)
 * and shows manual instructions for iOS.
 */
export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Don't show if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // Don't show if previously dismissed
    if (localStorage.getItem(DISMISSED_KEY) === 'true') return

    // Detect iOS
    const ua = navigator.userAgent
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window)
    setIsIOS(isiOS)

    if (isiOS) {
      // Show iOS instructions after short delay
      const timer = setTimeout(() => setShowPrompt(true), 2000)
      return () => clearTimeout(timer)
    }

    // Android/Chrome: listen for beforeinstallprompt
    function handleBeforeInstall(e: Event) {
      e.preventDefault()
      deferredPromptRef.current = e as BeforeInstallPromptEvent
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  function dismiss() {
    setShowPrompt(false)
    localStorage.setItem(DISMISSED_KEY, 'true')
  }

  async function handleInstall() {
    if (deferredPromptRef.current) {
      await deferredPromptRef.current.prompt()
      const result = await deferredPromptRef.current.userChoice
      if (result.outcome === 'accepted') {
        setShowPrompt(false)
      }
      deferredPromptRef.current = null
    }
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 bg-white rounded-xl shadow-lg border border-gray-200 p-4">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        aria-label="Dismiss install prompt"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">Install Manifest</h3>
          {isIOS ? (
            <p className="text-xs text-gray-500 mt-1">
              Tap <Share className="w-3 h-3 inline-block mx-0.5" /> then &quot;Add to Home Screen&quot; for the best experience.
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-500 mt-1">
                Install the app for faster access and offline support.
              </p>
              <button
                onClick={handleInstall}
                className="mt-2 px-4 py-1.5 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary/90 transition-colors"
              >
                Install App
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** Type for beforeinstallprompt event (not in standard TS lib) */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
