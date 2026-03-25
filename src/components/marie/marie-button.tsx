'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { MariePanel } from './marie-panel'

interface MarieButtonProps {
  alertCount?: number
}

export function MarieButton({ alertCount = 0 }: MarieButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-[#EC008C] p-4 text-white shadow-lg hover:bg-[#d4007e] transition-colors"
        aria-label="Open Marie AI assistant"
      >
        <Sparkles className="w-6 h-6" />
        {alertCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {alertCount > 99 ? '99+' : alertCount}
          </span>
        )}
        {alertCount === 0 && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3 rounded-full bg-red-500 opacity-0" />
        )}
      </button>

      {/* Panel */}
      <MariePanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
