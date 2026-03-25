'use client'

import { X } from 'lucide-react'
import { MarieChat } from './marie-chat'
import { useMarie } from './use-marie'

interface MariePanelProps {
  isOpen: boolean
  onClose: () => void
}

export function MariePanel({ isOpen, onClose }: MariePanelProps) {
  const { messages, isLoading, sendQuery } = useMarie()

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-[400px] max-w-full bg-white shadow-xl z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Marie</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Chat body */}
        <div className="flex-1 min-h-0">
          <MarieChat
            messages={messages}
            isLoading={isLoading}
            onSend={sendQuery}
          />
        </div>
      </div>
    </>
  )
}
